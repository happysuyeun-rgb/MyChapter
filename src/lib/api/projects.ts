import { isDevBypass } from '@/lib/devBypass'
import {
  mockCreateProject,
  mockGetProjectById,
  mockGetProjectCount,
  mockGetProjects,
} from '@/mocks'
import { supabase } from '@/lib/supabase'
import type { Project, ProjectType } from '@/types/database'
import type { NewProjectDraft } from '@/stores/projectStore'
import { calculateRoutine } from '@/utils/calculateRoutine'
import { BOOK_READINESS_RULES } from '@/utils/bookReadiness'

export async function getProjects(userId: string): Promise<Project[]> {
  if (isDevBypass()) return mockGetProjects()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getProjectCount(userId: string): Promise<number> {
  if (isDevBypass()) return mockGetProjectCount()

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
  if (isDevBypass()) return mockCreateProject(userId, draft)

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
  if (isDevBypass()) return mockGetProjectById(projectId)

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw error
  return data
}


export async function updateProjectSettings(
  projectId: string,
  userId: string,
  input: { title: string; type: ProjectType },
): Promise<Project> {
  if (isDevBypass()) {
    const { mockUpdateProjectSettings } = await import('@/mocks/projects')
    return mockUpdateProjectSettings(projectId, userId, input)
  }

  const title = input.title.trim()
  if (!title) throw new Error('책 제목을 입력해주세요.')

  const rule = BOOK_READINESS_RULES[input.type]
  if (!rule) throw new Error('지원하지 않는 책 유형입니다.')

  const { data, error } = await supabase
    .from('projects')
    .update({
      title,
      type: input.type,
      readiness_min_days: rule.minDays,
      readiness_min_records: rule.minRecords,
      readiness_target_days: rule.targetDays,
      readiness_target_records: rule.targetRecords,
      readiness_policy_version: 1,
    })
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
