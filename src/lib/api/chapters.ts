import { resolveFunctionPayload } from '@/lib/api/functionInvoke'
import { isDevBypass } from '@/lib/devBypass'
import {
  mockGenerateChapter,
  mockGetChapter,
  mockGetUnassignedRecordCount,
  mockListChapters,
  mockRegenerateChapter,
  mockReorderChapters,
  mockUpdateChapterContent,
} from '@/mocks'
import { supabase } from '@/lib/supabase'
import type { Chapter } from '@/types/database'

export class ChapterApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export async function listChapters(projectId: string): Promise<Chapter[]> {
  if (isDevBypass()) return mockListChapters(projectId)

  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getChapter(id: string, userId?: string): Promise<Chapter | null> {
  if (isDevBypass()) {
    const chapter = mockGetChapter(id)
    return chapter && (!userId || chapter.user_id === userId) ? chapter : null
  }

  let query = supabase.from('chapters').select('*').eq('id', id)
  if (userId) query = query.eq('user_id', userId)
  const { data, error } = await query.maybeSingle()

  if (error) throw error
  return data
}

export async function getChapterRecordCountMap(projectId: string): Promise<Record<string, number>> {
  if (isDevBypass()) {
    const chapters = mockListChapters(projectId)
    return Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter.record_ids.length]))
  }

  const { data: chapters, error: chapterError } = await supabase
    .from('chapters')
    .select('id')
    .eq('project_id', projectId)

  if (chapterError) throw chapterError
  if (!chapters?.length) return {}

  const chapterIds = chapters.map((chapter) => chapter.id)
  const { data: relations, error: relationError } = await supabase
    .from('chapter_records')
    .select('chapter_id')
    .in('chapter_id', chapterIds)

  if (relationError) throw relationError

  return (relations ?? []).reduce<Record<string, number>>((counts, relation) => {
    counts[relation.chapter_id] = (counts[relation.chapter_id] ?? 0) + 1
    return counts
  }, {})
}

export async function getUnassignedRecordCount(projectId: string): Promise<number> {
  if (isDevBypass()) return mockGetUnassignedRecordCount(projectId)

  const [{ data: records, error: recordError }, { data: chapters, error: chapterError }] = await Promise.all([
    supabase
      .from('records')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_draft', false),
    supabase
      .from('chapters')
      .select('id')
      .eq('project_id', projectId),
  ])

  if (recordError) throw recordError
  if (chapterError) throw chapterError
  if (!records?.length) return 0
  if (!chapters?.length) return records.length

  const { data: relations, error: relationError } = await supabase
    .from('chapter_records')
    .select('record_id')
    .in('chapter_id', chapters.map((chapter) => chapter.id))

  if (relationError) throw relationError

  const assigned = new Set((relations ?? []).map((relation) => relation.record_id))
  return records.reduce((count, record) => count + (assigned.has(record.id) ? 0 : 1), 0)
}

export async function updateChapterContent(
  chapterId: string,
  title: string,
  userContent: string,
): Promise<Chapter> {
  if (isDevBypass()) return mockUpdateChapterContent(chapterId, title, userContent)

  const { data, error } = await supabase
    .from('chapters')
    .update({ title, user_content: userContent })
    .eq('id', chapterId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function generateChapter(projectId: string): Promise<Chapter | null> {
  if (isDevBypass()) return mockGenerateChapter(projectId)

  const response = await supabase.functions.invoke('generate-chapter', {
    body: { project_id: projectId },
  })

  const { data, errorBody, error } = await resolveFunctionPayload<{
    chapter_id?: string
    code?: string
    error?: string
  }>(response)

  const code = errorBody?.code ?? data?.code
  const message = errorBody?.error ?? data?.error

  if (code === 'NOT_ENOUGH_MATERIAL') {
    throw new ChapterApiError('NOT_ENOUGH_MATERIAL', message ?? '챕터를 만들기 위한 기록이 조금 더 필요해요.')
  }

  if (code === 'BOOK_NOT_READY') {
    throw new ChapterApiError(
      'BOOK_NOT_READY',
      message ?? '아직 책 만들기 준비가 되지 않았어요. 기록과 기간이 충분히 쌓인 뒤 다시 시도해주세요.',
    )
  }

  if (code === 'AI_UNAVAILABLE') {
    throw new ChapterApiError(
      'AI_UNAVAILABLE',
      message ?? 'AI 원고를 만들지 못했어요. 잠시 후 다시 시도해주세요.',
    )
  }

  if (error || message) {
    throw new ChapterApiError(code ?? 'CHAPTER_GENERATE_FAILED', message ?? '챕터 생성에 실패했어요.')
  }

  if (data?.chapter_id) {
    return getChapter(data.chapter_id)
  }

  return null
}

export async function reorderChapters(
  projectId: string,
  orderedChapterIds: string[],
): Promise<void> {
  if (isDevBypass()) {
    mockReorderChapters(projectId, orderedChapterIds)
    return
  }

  const offset = 1000

  for (let i = 0; i < orderedChapterIds.length; i++) {
    const { error } = await supabase
      .from('chapters')
      .update({ chapter_number: offset + i })
      .eq('id', orderedChapterIds[i])
      .eq('project_id', projectId)

    if (error) throw error
  }

  for (let i = 0; i < orderedChapterIds.length; i++) {
    const { error } = await supabase
      .from('chapters')
      .update({
        sort_order: i,
        chapter_number: i + 1,
      })
      .eq('id', orderedChapterIds[i])
      .eq('project_id', projectId)

    if (error) throw error
  }
}

export async function regenerateChapter(chapterId: string): Promise<Chapter> {
  if (isDevBypass()) return mockRegenerateChapter(chapterId)

  const response = await supabase.functions.invoke('regenerate-chapter', {
    body: { chapter_id: chapterId },
  })

  const { data, errorBody, error } = await resolveFunctionPayload<{
    code?: string
    error?: string
  }>(response)

  const code = errorBody?.code ?? data?.code
  const message = errorBody?.error ?? data?.error
  if (code === 'AI_UNAVAILABLE') {
    throw new ChapterApiError(
      'AI_UNAVAILABLE',
      message ?? 'AI 원고를 만들지 못했어요. 잠시 후 다시 시도해주세요.',
    )
  }
  if (error || message) {
    throw new ChapterApiError(
      code ?? 'CHAPTER_REGENERATE_FAILED',
      message ?? '챕터 재생성에 실패했어요.',
    )
  }

  const chapter = await getChapter(chapterId)
  if (!chapter) throw new Error('챕터를 찾을 수 없어요.')
  return chapter
}
