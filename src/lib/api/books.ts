import { supabase } from '@/lib/supabase'
import { getSubscriptionPlan } from './subscriptions'
import type { Chapter, Database, Project } from '@/types/database'
import { getChapterDisplayContent } from '@/utils/chapterContent'

export class BookApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export interface PublishedBook {
  id: string
  project_id: string
  version: number
  status: 'processing' | 'published' | 'failed'
  title_snapshot: string
  subtitle_snapshot: string | null
  author_snapshot: string
  cover_template_id: string
  pdf_url: string
  page_count: number | null
  published_at: string
}

export interface BookExportData {
  project: Project
  chapters: Chapter[]
  authorName: string
  coverTemplateId: string
}

export async function getPublishedBook(projectId: string): Promise<PublishedBook | null> {
  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'published')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? mapPublication(data) : null
}

export interface PublishedBookWithProject extends PublishedBook {
  project_title: string
}

function getCoverTemplateId(coverSnapshot: unknown): string {
  if (
    coverSnapshot &&
    typeof coverSnapshot === 'object' &&
    'template_id' in coverSnapshot &&
    typeof (coverSnapshot as { template_id?: unknown }).template_id === 'string'
  ) {
    return (coverSnapshot as { template_id: string }).template_id
  }
  return 'cover_01'
}

function mapPublication(row: Database['public']['Tables']['publications']['Row']): PublishedBook {
  return {
    id: row.id,
    project_id: row.project_id,
    version: row.version,
    status: row.status,
    title_snapshot: row.title_snapshot,
    subtitle_snapshot: row.subtitle_snapshot,
    author_snapshot: row.author_snapshot,
    cover_template_id: getCoverTemplateId(row.cover_snapshot),
    pdf_url: row.pdf_path ?? '',
    page_count: row.page_count,
    published_at: row.published_at ?? row.created_at,
  }
}

export async function listPublishedBooks(userId: string): Promise<PublishedBookWithProject[]> {
  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const publication = mapPublication(row)
    return {
      ...publication,
      project_title: publication.title_snapshot,
    }
  })
}

export async function getPublishedBookById(
  userId: string,
  publicationId: string,
): Promise<PublishedBookWithProject | null> {
  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .eq('id', publicationId)
    .eq('user_id', userId)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const publication = mapPublication(data)
  return {
    ...publication,
    project_title: publication.title_snapshot,
  }
}

export async function getPublishedBookSignedUrl(storagePath: string): Promise<string> {
  if (!storagePath) throw new Error('PDF 경로가 없어요.')

  const { data, error } = await supabase.storage
    .from('published-pdfs')
    .createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) {
    throw error ?? new Error('PDF를 열 수 없어요.')
  }

  return data.signedUrl
}

export async function canPublishBook(userId: string): Promise<boolean> {
  const plan = await getSubscriptionPlan(userId)
  if (plan === 'pro') return true

  const { count, error } = await supabase
    .from('publications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'published')

  if (error) throw error
  return (count ?? 0) < 1
}

export async function prepareBookExport(
  userId: string,
  project: Project,
  chapters: Chapter[],
  authorName: string,
  coverTemplateId: string,
): Promise<BookExportData> {
  const allowed = await canPublishBook(userId)
  if (!allowed) {
    throw new BookApiError('PUBLICATION_LIMIT', 'Free 플랜의 첫 책 발행을 이미 사용했어요.')
  }

  return { project, chapters, authorName, coverTemplateId }
}

export function buildBookHtml(data: BookExportData): string {
  const { project, chapters, authorName, coverTemplateId } = data

  const chapterHtml = chapters
    .map(
      (ch) => `
      <section class="chapter">
        <p class="chapter-label">Chapter ${ch.chapter_number}</p>
        <h2>${escapeHtml(ch.title)}</h2>
        ${getChapterDisplayContent(ch)
          .split('\n\n')
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join('')}
      </section>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(project.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    @page { margin: 2cm; }
    body { font-family: 'Noto Serif KR', serif; color: #1a1a18; line-height: 2; }
    .cover { page-break-after: always; text-align: center; padding-top: 35%; }
    .cover h1 { font-size: 28px; margin-bottom: 12px; }
    .cover .author { font-size: 14px; color: #6b6b67; }
    .chapter { page-break-before: always; }
    .chapter-label { font-size: 12px; color: #b0b0ac; margin-bottom: 8px; }
    .chapter h2 { font-size: 22px; margin-bottom: 24px; }
    .chapter p { margin-bottom: 16px; font-size: 15px; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${escapeHtml(project.title)}</h1>
    <div class="author">${escapeHtml(authorName)}</div>
    <p style="font-size:11px;color:#b0b0ac;margin-top:24px;">${coverTemplateId}</p>
  </div>
  ${chapterHtml}
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function downloadBookHtml(data: BookExportData): Promise<{ pageCount: number }> {
  const html = buildBookHtml(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.project.title}.html`
  a.click()
  URL.revokeObjectURL(url)

  const pageCount = Math.max(
    1,
    data.chapters.reduce((sum, ch) => sum + Math.ceil(getChapterDisplayContent(ch).length / 500), 0) + 1,
  )

  return { pageCount }
}

export async function generateBookPdf(
  projectId: string,
  coverTemplateId: string,
): Promise<{ publicationId: string; version: number; pdfUrl: string; storagePath: string; pageCount: number }> {
  const response = await supabase.functions.invoke('generate-pdf', {
    body: { project_id: projectId, cover_template_id: coverTemplateId },
  })

  const body = response.data as {
    pdf_url?: string
    storage_path?: string
    page_count?: number
    publication_id?: string
    version?: number
    code?: string
    error?: string
  } | null

  if (body?.code === 'PUBLICATION_LIMIT' || body?.code === 'PDF_PRO_ONLY') {
    throw new BookApiError('PUBLICATION_LIMIT', body.error ?? 'Free 플랜의 첫 책 발행을 이미 사용했어요.')
  }

  if (response.error || body?.error || !body?.pdf_url || !body?.publication_id || !body?.version) {
    throw new BookApiError('PDF_GENERATE_FAILED', body?.error ?? 'PDF 생성에 실패했어요.')
  }

  return {
    publicationId: body.publication_id,
    version: body.version,
    pdfUrl: body.pdf_url,
    storagePath: body.storage_path ?? `${projectId}/v${body.version}.pdf`,
    pageCount: body.page_count ?? 1,
  }
}

export function downloadPdfFromUrl(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.target = '_blank'
  a.rel = 'noopener'
  a.click()
}
