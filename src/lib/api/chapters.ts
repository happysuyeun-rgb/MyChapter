import { devBypassMocks } from '@/lib/devBypassMocks'
import { isDevBypass } from '@/lib/devBypass'
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
  if (isDevBypass()) return devBypassMocks.listChapters(projectId)

  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getChapter(id: string): Promise<Chapter | null> {
  if (isDevBypass()) return devBypassMocks.getChapter(id)

  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getUnassignedRecordCount(projectId: string): Promise<number> {
  if (isDevBypass()) return devBypassMocks.getUnassignedRecordCount(projectId)

  const { count, error } = await supabase
    .from('records')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('chapter_id', null)
    .eq('is_draft', false)

  if (error) throw error
  return count ?? 0
}

export async function updateChapterContent(
  chapterId: string,
  title: string,
  userContent: string,
): Promise<Chapter> {
  if (isDevBypass()) return devBypassMocks.updateChapterContent(chapterId, title, userContent)

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
  if (isDevBypass()) return devBypassMocks.generateChapter(projectId)

  const response = await supabase.functions.invoke('generate-chapter', {
    body: { project_id: projectId },
  })

  const body = response.data as {
    chapter_id?: string
    code?: string
    error?: string
  } | null

  if (body?.code === 'CHAPTER_LIMIT') {
    throw new ChapterApiError('CHAPTER_LIMIT', 'Free 플랜은 챕터 3개까지예요.')
  }

  if (body?.chapter_id) {
    return getChapter(body.chapter_id)
  }

  return null
}

export async function reorderChapters(
  projectId: string,
  orderedChapterIds: string[],
): Promise<void> {
  if (isDevBypass()) {
    devBypassMocks.reorderChapters(projectId, orderedChapterIds)
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
  if (isDevBypass()) return devBypassMocks.regenerateChapter(chapterId)

  const response = await supabase.functions.invoke('regenerate-chapter', {
    body: { chapter_id: chapterId },
  })

  if (response.error) {
    throw new Error('챕터 재생성에 실패했어요.')
  }

  const chapter = await getChapter(chapterId)
  if (!chapter) throw new Error('챕터를 찾을 수 없어요.')
  return chapter
}
