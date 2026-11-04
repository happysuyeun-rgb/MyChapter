import type { NewProjectDraft } from '@/stores/projectStore'
import { mockNowIso, mockStore, newMockId } from '@/mocks/state'
import type { Project, ProjectType } from '@/types/database'
import { calculateRoutine } from '@/utils/calculateRoutine'
import { BOOK_READINESS_RULES } from '@/utils/bookReadiness'

export function mockGetProjects(): Project[] {
  return mockStore.projects.filter((p) => !p.archived_at)
}

export function mockGetProjectCount(): number {
  return mockStore.projects.length
}

export function mockArchiveProject(projectId: string, userId: string): Project {
  const index = mockStore.projects.findIndex((p) => p.id === projectId && p.user_id === userId)
  if (index < 0) throw new Error('책을 찾을 수 없어요.')
  if (mockStore.projects[index].archived_at) throw new Error('이미 보관한 책이에요.')

  const updated: Project = {
    ...mockStore.projects[index],
    archived_at: mockNowIso(),
    updated_at: mockNowIso(),
  }
  mockStore.projects[index] = updated
  return updated
}

export function mockDeleteProject(projectId: string, userId: string): void {
  const index = mockStore.projects.findIndex((p) => p.id === projectId && p.user_id === userId)
  if (index < 0) throw new Error('책을 찾을 수 없어요.')
  mockStore.projects.splice(index, 1)
  mockStore.records = mockStore.records.filter((r) => r.project_id !== projectId)
}

export function mockGetProjectById(projectId: string): Project | null {
  return mockStore.projects.find((p) => p.id === projectId) ?? null
}

export function mockCreateProject(userId: string, draft: NewProjectDraft): Project {
  if (!draft.type || !draft.title.trim()) {
    throw new Error('프로젝트 정보가 올바르지 않습니다.')
  }

  const routine = calculateRoutine(draft.periodDays, draft.frequency)
  const project: Project = {
    id: newMockId(),
    user_id: userId,
    type: draft.type,
    title: draft.title.trim(),
    subtitle: null,
    author_name: null,
    ready_at: null,
    manuscript_reviewed_at: null,
    final_review_completed_at: null,
    archived_at: null,
    readiness_min_days: BOOK_READINESS_RULES[draft.type]?.minDays ?? 30,
    readiness_min_records: BOOK_READINESS_RULES[draft.type]?.minRecords ?? 20,
    readiness_target_days: BOOK_READINESS_RULES[draft.type]?.targetDays ?? 60,
    readiness_target_records: BOOK_READINESS_RULES[draft.type]?.targetRecords ?? 30,
    readiness_policy_version: 1,
    selected_cover_id: null,
    target_count: routine.targetCount,
    frequency: draft.frequency,
    notification_time: draft.notificationTime,
    record_mode: draft.recordMode,
    cover_template_id: null,
    is_completed: false,
    started_at: new Date().toISOString().slice(0, 10),
    target_date: routine.targetDate.toISOString().slice(0, 10),
    created_at: mockNowIso(),
    updated_at: mockNowIso(),
  }

  mockStore.projects.unshift(project)
  return project
}


export function mockUpdateProjectSettings(
  projectId: string,
  userId: string,
  input: { title: string; type: ProjectType },
): Project {
  const index = mockStore.projects.findIndex((p) => p.id === projectId && p.user_id === userId)
  if (index < 0) throw new Error('책을 찾을 수 없어요.')

  const rule = BOOK_READINESS_RULES[input.type]
  if (!rule) throw new Error('지원하지 않는 책 유형입니다.')

  const updated: Project = {
    ...mockStore.projects[index],
    title: input.title.trim(),
    type: input.type,
    readiness_min_days: rule.minDays,
    readiness_min_records: rule.minRecords,
    readiness_target_days: rule.targetDays,
    readiness_target_records: rule.targetRecords,
    readiness_policy_version: 1,
    updated_at: mockNowIso(),
  }

  mockStore.projects[index] = updated
  return updated
}


export function mockUpdateProjectCoverSelection(
  projectId: string,
  userId: string,
  coverId: string,
): Project {
  const index = mockStore.projects.findIndex((p) => p.id === projectId && p.user_id === userId)
  if (index < 0) throw new Error('책을 찾을 수 없어요.')

  const updated: Project = {
    ...mockStore.projects[index],
    selected_cover_id: coverId,
    updated_at: mockNowIso(),
  }

  mockStore.projects[index] = updated
  return updated
}
