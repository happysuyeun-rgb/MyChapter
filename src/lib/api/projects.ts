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
import { BOOK_READINESS_RULES, getBookReadiness } from '@/utils/bookReadiness'

export async function getProjects(userId: string): Promise<Project[]> {
  if (isDevBypass()) return mockGetProjects()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  const projects = data ?? []
  // Duration may become sufficient without another Record insert. Persist the
  // sticky milestone before returning projects to Home, Library and Workspace.
  return Promise.all(projects.map((project) => ensureProjectReady(project, userId)))
}

/** Persists an earned readiness milestone without ever resetting an existing one. */
export async function ensureProjectReady(project: Project, userId: string): Promise<Project> {
  if (project.ready_at) return project
  if (project.user_id !== userId) throw new Error('책 소유권이 일치하지 않습니다.')
  const minDays = project.readiness_min_days ?? BOOK_READINESS_RULES[project.type]?.minDays ?? 30
  const start = project.started_at || project.created_at.slice(0, 10)
  // If time requirement has not elapsed, avoid a needless record-count query.
  const nowDate = new Date()
  const startDate = new Date(start)
  const today = Date.UTC(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate())
  const firstDay = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
  if (Math.floor((today - firstDay) / 86_400_000) + 1 < minDays) return project

  if (isDevBypass()) {
    const { mockGetRecordCount } = await import('@/mocks')
    if (!getBookReadiness(project, mockGetRecordCount(project.id)).isReady) return project
    project.ready_at = new Date().toISOString()
    return project
  }

  const { count, error: countError } = await supabase.from('records')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', project.id).eq('user_id', userId).eq('is_draft', false)
  if (countError) throw countError
  if (!getBookReadiness(project, count ?? 0).isReady) return project
  const { data, error } = await supabase.from('projects')
    .update({ ready_at: new Date().toISOString() })
    .eq('id', project.id).eq('user_id', userId).is('ready_at', null)
    .select().maybeSingle()
  if (error) throw error
  if (data) return data
  // A concurrent read may have marked the book ready: fetch its authoritative row.
  const latest = await getProjectById(project.id)
  return latest ?? project
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

  // Preserve Ready earned under the previous policy before a type change.
  await ensureProjectReady(await getProjectById(projectId) ?? (() => { throw new Error('책을 찾을 수 없어요.') })(), userId)

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


export async function updateProjectCoverSelection(
  projectId: string,
  userId: string,
  coverId: string,
): Promise<Project> {
  if (isDevBypass()) {
    const { mockUpdateProjectCoverSelection } = await import('@/mocks/projects')
    return mockUpdateProjectCoverSelection(projectId, userId, coverId)
  }

  const { data, error } = await supabase
    .from('projects')
    .update({ selected_cover_id: coverId })
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Explicit, owned workflow completion; only successful database writes count. */
export async function completeManuscriptReview(projectId: string, userId: string): Promise<Project> {
  if (isDevBypass()) {
    const project = mockGetProjectById(projectId)
    if (!project || project.user_id !== userId) throw new Error('책을 찾을 수 없어요.')
    project.manuscript_reviewed_at = new Date().toISOString()
    project.final_review_completed_at = null
    return project
  }
  const { data, error } = await supabase.from('projects')
    .update({ manuscript_reviewed_at: new Date().toISOString(), final_review_completed_at: null })
    .eq('id', projectId).eq('user_id', userId).select().single()
  if (error) throw error
  return data
}

export async function completeFinalReview(projectId: string, userId: string): Promise<Project> {
  if (isDevBypass()) {
    const project = mockGetProjectById(projectId)
    if (!project || project.user_id !== userId || !project.manuscript_reviewed_at) throw new Error('원고 확인을 먼저 완료해주세요.')
    project.final_review_completed_at = new Date().toISOString()
    return project
  }
  const { data, error } = await supabase.from('projects')
    .update({ final_review_completed_at: new Date().toISOString() })
    .eq('id', projectId).eq('user_id', userId).not('manuscript_reviewed_at', 'is', null)
    .select().single()
  if (error) throw error
  return data
}

/** Reopen a completed final review explicitly; keep manuscript review intact. */
export async function reopenFinalReview(projectId: string, userId: string): Promise<Project> {
  if (isDevBypass()) {
    const project = mockGetProjectById(projectId)
    if (!project || project.user_id !== userId) throw new Error('책을 찾을 수 없어요.')
    project.final_review_completed_at = null
    return project
  }
  const { data, error } = await supabase.from('projects')
    .update({ final_review_completed_at: null })
    .eq('id', projectId).eq('user_id', userId)
    .select().single()
  if (error) throw error
  return data
}
