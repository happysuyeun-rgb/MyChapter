import type { NewProjectDraft } from '@/stores/projectStore'
import { mockNowIso, mockStore, newMockId } from '@/mocks/state'
import type { Project } from '@/types/database'
import { calculateRoutine } from '@/utils/calculateRoutine'

export function mockGetProjects(): Project[] {
  return [...mockStore.projects]
}

export function mockGetProjectCount(): number {
  return mockStore.projects.length
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
