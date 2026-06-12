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
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getChapter(id: string): Promise<Chapter | null> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getUnassignedRecordCount(projectId: string): Promise<number> {
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

export async function regenerateChapter(chapterId: string): Promise<Chapter> {
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
