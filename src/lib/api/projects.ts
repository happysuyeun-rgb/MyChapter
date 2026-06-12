import { supabase } from '@/lib/supabase'
import type { Project } from '@/types/database'
import type { NewProjectDraft } from '@/stores/projectStore'
import { calculateRoutine } from '@/utils/calculateRoutine'

export async function getProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getProjectCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw error
  return count ?? 0
}

export async function createProject(
  userId: string,
  draft: NewProjectDraft,
): Promise<Project> {
  if (!draft.type || !draft.title.trim()) {
    throw new Error('프로젝트 정보가 올바르지 않습니다.')
  }

  const routine = calculateRoutine(draft.periodDays, draft.frequency)

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      type: draft.type,
      title: draft.title.trim(),
      target_count: routine.targetCount,
      frequency: draft.frequency,
      notification_time: draft.notificationTime,
      record_mode: draft.recordMode,
      target_date: routine.targetDate.toISOString().slice(0, 10),
      started_at: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw error
  return data
}
