import { supabase } from '@/lib/supabase'
import { getSubscriptionPlan } from './subscriptions'
import type { Chapter, Project } from '@/types/database'
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
  pdf_url: string
  cover_template_id: string
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
    .from('published_books')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) throw error
  return data
}

export interface PublishedBookWithProject extends PublishedBook {
  project_title: string
}

export async function listPublishedBooks(userId: string): Promise<PublishedBookWithProject[]> {
  const { data: books, error } = await supabase
    .from('published_books')
    .select('*')
    .eq('user_id', userId)
    .order('published_at', { ascending: false })

  if (error) throw error
  if (!books?.length) return []

  const projectIds = books.map((b) => b.project_id)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .in('id', projectIds)

  const titleMap = new Map((projects ?? []).map((p) => [p.id, p.title]))

  return books.map((book) => ({
    ...book,
    project_title: titleMap.get(book.project_id) ?? '나의 책',
  }))
}

export async function prepareBookExport(
  userId: string,
  project: Project,
  chapters: Chapter[],
  authorName: string,
  coverTemplateId: string,
): Promise<BookExportData> {
  const plan = await getSubscriptionPlan(userId)
  if (plan !== 'pro') {
    throw new BookApiError('PDF_PRO_ONLY', 'PDF 출판은 Pro 플랜이 필요해요.')
  }

  return { project, chapters, authorName, coverTemplateId }
}

export async function savePublishedBook(
  userId: string,
  projectId: string,
  coverTemplateId: string,
  pageCount: number,
  storagePath: string,
): Promise<void> {
  await supabase.from('published_books').upsert({
    project_id: projectId,
    user_id: userId,
    pdf_url: storagePath,
    cover_template_id: coverTemplateId,
    page_count: pageCount,
  })

  await supabase
    .from('projects')
    .update({ cover_template_id: coverTemplateId, is_completed: true })
    .eq('id', projectId)
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
