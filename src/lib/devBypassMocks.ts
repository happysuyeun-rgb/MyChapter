import type { Chapter, JournalRecord, Project, SubscriptionPlan } from '@/types/database'
import type { CreateRecordInput, SaveRecordResult, UpdateRecordInput } from '@/lib/api/records'
import type { SubscriptionInfo } from '@/lib/api/subscriptions'
import type { NewProjectDraft } from '@/stores/projectStore'
import { checkBadgeEvents } from '@/utils/badges'
import { calculateStreak } from '@/utils/streak'
import { calculateRoutine } from '@/utils/calculateRoutine'
import {
  DEV_MOCK_PROJECT,
  DEV_MOCK_PROJECT_ID,
  DEV_MOCK_TODAY_QUESTION,
  DEV_MOCK_USER_ID,
} from '@/lib/devBypass'

const NOW = '2026-06-12T00:00:00.000Z'

const MOCK_RECORD_IDS = [
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000012',
] as const

const MOCK_CHAPTER_ID = '00000000-0000-4000-8000-000000000020'

function newId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

const initialRecords: JournalRecord[] = [
  {
    id: MOCK_RECORD_IDS[0],
    project_id: DEV_MOCK_PROJECT_ID,
    user_id: DEV_MOCK_USER_ID,
    record_number: 1,
    mode: 'question',
    question_text: DEV_MOCK_TODAY_QUESTION,
    title: null,
    content: '오늘은 카페 창가에 앉아 비 오는 거리를 바라봤어요. 잠깐의 멈춤이 오히려 마음을 가볍게 만들었습니다.',
    photo_url: null,
    emotion_tags: ['평온'],
    chapter_id: null,
    is_draft: false,
    created_at: '2026-06-10T12:00:00.000Z',
    updated_at: '2026-06-10T12:00:00.000Z',
  },
  {
    id: MOCK_RECORD_IDS[1],
    project_id: DEV_MOCK_PROJECT_ID,
    user_id: DEV_MOCK_USER_ID,
    record_number: 2,
    mode: 'question',
    question_text: '어제보다 조금 더 나다운 하루였나요?',
    title: null,
    content: '오랜만에 친구에게 먼저 연락했어요. 작은 용기가 관계를 다시 이어주는 것 같아요.',
    photo_url: null,
    emotion_tags: ['기쁨'],
    chapter_id: null,
    is_draft: false,
    created_at: '2026-06-11T12:00:00.000Z',
    updated_at: '2026-06-11T12:00:00.000Z',
  },
  {
    id: MOCK_RECORD_IDS[2],
    project_id: DEV_MOCK_PROJECT_ID,
    user_id: DEV_MOCK_USER_ID,
    record_number: 3,
    mode: 'question',
    question_text: '오늘 스스로에게 고마웠던 순간은?',
    title: null,
    content: '피곤해도 산책을 10분만 했어요. 몸보다 마음이 먼저 회복되는 느낌이었습니다.',
    photo_url: null,
    emotion_tags: ['감사'],
    chapter_id: null,
    is_draft: false,
    created_at: '2026-06-12T09:00:00.000Z',
    updated_at: '2026-06-12T09:00:00.000Z',
  },
]

const initialChapters: Chapter[] = []

let mockRecords: JournalRecord[] = [...initialRecords]
let mockChapters: Chapter[] = [...initialChapters]
let mockProjects: Project[] = [DEV_MOCK_PROJECT]

function projectRecords(projectId: string): JournalRecord[] {
  return mockRecords.filter(
    (r) => r.project_id === projectId && !r.is_draft,
  )
}

function buildSaveResult(
  record: JournalRecord,
  projectId: string,
  targetCount: number,
): SaveRecordResult {
  const allRecords = projectRecords(projectId)
  const recordCount = allRecords.length
  const streak = calculateStreak(allRecords)
  const progress = Math.min(100, Math.round((recordCount / targetCount) * 100))
  const badges = checkBadgeEvents(streak, recordCount)

  return {
    record,
    recordCount,
    progress,
    streak,
    badgeTitles: badges.map((b) => b.title),
  }
}

export const devBypassMocks = {
  // --- projects ---
  getProjects(): Project[] {
    return [...mockProjects]
  },

  getProjectCount(): number {
    return mockProjects.length
  },

  getProjectById(projectId: string): Project | null {
    return mockProjects.find((p) => p.id === projectId) ?? null
  },

  createProject(userId: string, draft: NewProjectDraft): Project {
    if (!draft.type || !draft.title.trim()) {
      throw new Error('프로젝트 정보가 올바르지 않습니다.')
    }

    const routine = calculateRoutine(draft.periodDays, draft.frequency)
    const project: Project = {
      id: newId(),
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
      created_at: nowIso(),
      updated_at: nowIso(),
    }

    mockProjects = [project, ...mockProjects]
    return project
  },

  // --- records ---
  listRecords(
    userId: string,
    options?: { projectId?: string; limit?: number; offset?: number },
  ): JournalRecord[] {
    let rows = mockRecords.filter((r) => r.user_id === userId && !r.is_draft)

    if (options?.projectId) {
      rows = rows.filter((r) => r.project_id === options.projectId)
    }

    rows.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    const offset = options?.offset ?? 0
    if (options?.limit) {
      rows = rows.slice(offset, offset + options.limit)
    }

    return rows
  },

  getRecord(id: string): JournalRecord | null {
    return mockRecords.find((r) => r.id === id) ?? null
  },

  getRecordCount(projectId: string): number {
    return projectRecords(projectId).length
  },

  getNextRecordNumber(projectId: string): number {
    const records = projectRecords(projectId)
    const max = records.reduce((n, r) => Math.max(n, r.record_number), 0)
    return max + 1
  },

  createRecord(input: CreateRecordInput, targetCount: number): SaveRecordResult {
    const recordNumber = this.getNextRecordNumber(input.projectId)
    const ts = nowIso()

    const record: JournalRecord = {
      id: newId(),
      project_id: input.projectId,
      user_id: input.userId,
      record_number: recordNumber,
      mode: input.mode,
      content: input.content,
      question_text: input.questionText ?? null,
      title: input.title ?? null,
      photo_url: input.photoUrl ?? null,
      emotion_tags: input.emotionTags,
      chapter_id: null,
      is_draft: false,
      created_at: ts,
      updated_at: ts,
    }

    mockRecords = [...mockRecords, record]
    return buildSaveResult(record, input.projectId, targetCount)
  },

  updateRecord(
    id: string,
    userId: string,
    projectId: string,
    input: UpdateRecordInput,
    targetCount: number,
  ): SaveRecordResult {
    const index = mockRecords.findIndex((r) => r.id === id && r.user_id === userId)
    if (index < 0) throw new Error('기록을 찾을 수 없어요.')

    const updated: JournalRecord = {
      ...mockRecords[index],
      content: input.content ?? mockRecords[index].content,
      title: input.title !== undefined ? input.title : mockRecords[index].title,
      photo_url: input.photoUrl !== undefined ? input.photoUrl : mockRecords[index].photo_url,
      emotion_tags: input.emotionTags ?? mockRecords[index].emotion_tags,
      question_text:
        input.questionText !== undefined
          ? input.questionText
          : mockRecords[index].question_text,
      updated_at: nowIso(),
    }

    mockRecords = [
      ...mockRecords.slice(0, index),
      updated,
      ...mockRecords.slice(index + 1),
    ]

    return buildSaveResult(updated, projectId, targetCount)
  },

  deleteRecord(id: string, userId: string): void {
    mockRecords = mockRecords.filter((r) => !(r.id === id && r.user_id === userId))
  },

  uploadRecordPhoto(_userId: string, _projectId: string, file: File): string {
    return `mock/${file.name}`
  },

  getPhotoSignedUrl(_path: string): string | null {
    return null
  },

  // --- questions ---
  generateQuestion(): string {
    return DEV_MOCK_TODAY_QUESTION
  },

  getTodayQuestion(): string | null {
    return DEV_MOCK_TODAY_QUESTION
  },

  // --- chapters ---
  listChapters(projectId: string): Chapter[] {
    return mockChapters
      .filter((c) => c.project_id === projectId)
      .sort((a, b) => a.sort_order - b.sort_order)
  },

  getChapter(id: string): Chapter | null {
    return mockChapters.find((c) => c.id === id) ?? null
  },

  getUnassignedRecordCount(projectId: string): number {
    return mockRecords.filter(
      (r) => r.project_id === projectId && !r.is_draft && r.chapter_id === null,
    ).length
  },

  updateChapterContent(
    chapterId: string,
    title: string,
    userContent: string,
  ): Chapter {
    const index = mockChapters.findIndex((c) => c.id === chapterId)
    if (index < 0) throw new Error('챕터를 찾을 수 없어요.')

    const updated: Chapter = {
      ...mockChapters[index],
      title,
      user_content: userContent,
      updated_at: nowIso(),
    }

    mockChapters = [
      ...mockChapters.slice(0, index),
      updated,
      ...mockChapters.slice(index + 1),
    ]

    return updated
  },

  generateChapter(projectId: string): Chapter | null {
    const unassigned = mockRecords.filter(
      (r) => r.project_id === projectId && !r.is_draft && r.chapter_id === null,
    )

    if (unassigned.length < 10) return null

    const batch = unassigned.slice(0, 10)
    const recordIds = batch.map((r) => r.id)
    const chapterNumber = mockChapters.filter((c) => c.project_id === projectId).length + 1
    const ts = nowIso()

    const chapter: Chapter = {
      id: chapterNumber === 1 ? MOCK_CHAPTER_ID : newId(),
      project_id: projectId,
      user_id: DEV_MOCK_USER_ID,
      chapter_number: chapterNumber,
      title: `Chapter ${chapterNumber}`,
      ai_content: batch.map((r) => r.content).join('\n\n'),
      user_content: null,
      record_ids: recordIds,
      is_complete: true,
      sort_order: chapterNumber - 1,
      created_at: ts,
      updated_at: ts,
    }

    mockChapters = [...mockChapters, chapter]
    mockRecords = mockRecords.map((r) =>
      recordIds.includes(r.id) ? { ...r, chapter_id: chapter.id, updated_at: ts } : r,
    )

    return chapter
  },

  reorderChapters(_projectId: string, orderedChapterIds: string[]): void {
    mockChapters = mockChapters.map((chapter) => {
      const index = orderedChapterIds.indexOf(chapter.id)
      if (index < 0) return chapter
      return {
        ...chapter,
        sort_order: index,
        chapter_number: index + 1,
        updated_at: nowIso(),
      }
    })
  },

  regenerateChapter(chapterId: string): Chapter {
    const index = mockChapters.findIndex((c) => c.id === chapterId)
    if (index < 0) throw new Error('챕터를 찾을 수 없어요.')

    const chapter = mockChapters[index]
    const records = mockRecords.filter((r) => chapter.record_ids.includes(r.id))
    const aiContent =
      records.length > 0
        ? records.map((r) => r.content).join('\n\n')
        : 'AI가 생성한 원고입니다.'

    const updated: Chapter = {
      ...chapter,
      ai_content: aiContent,
      user_content: null,
      updated_at: nowIso(),
    }

    mockChapters = [
      ...mockChapters.slice(0, index),
      updated,
      ...mockChapters.slice(index + 1),
    ]

    return updated
  },

  // --- subscriptions ---
  getSubscriptionPlan(): SubscriptionPlan {
    return 'pro'
  },

  getSubscription(): SubscriptionInfo {
    return {
      plan: 'pro',
      started_at: NOW,
      expires_at: null,
    }
  },

  verifyPurchase(): SubscriptionPlan {
    return 'pro'
  },
}
