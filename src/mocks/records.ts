import type { CreateRecordInput, SaveRecordResult, UpdateRecordInput } from '@/lib/api/records'
import { mockNowIso, mockStore, newMockId } from '@/mocks/state'
import type { JournalRecord } from '@/types/database'
import { checkBadgeEvents } from '@/utils/badges'
import { calculateStreak } from '@/utils/streak'

function projectRecords(projectId: string): JournalRecord[] {
  return mockStore.records.filter((r) => r.project_id === projectId && !r.is_draft)
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

export function mockGetNextRecordNumber(projectId: string): number {
  const records = projectRecords(projectId)
  const max = records.reduce((n, r) => Math.max(n, r.record_number), 0)
  return max + 1
}

export function mockListRecords(
  userId: string,
  options?: { projectId?: string; limit?: number; offset?: number },
): JournalRecord[] {
  let rows = mockStore.records.filter((r) => r.user_id === userId && !r.is_draft)

  if (options?.projectId) {
    rows = rows.filter((r) => r.project_id === options.projectId)
  }

  rows.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const offset = options?.offset ?? 0
  if (options?.limit) {
    rows = rows.slice(offset, offset + options.limit)
  }

  return rows
}

export function mockGetRecord(id: string): JournalRecord | null {
  return mockStore.records.find((r) => r.id === id) ?? null
}

export function mockGetRecordCount(projectId: string): number {
  return projectRecords(projectId).length
}

export function mockCreateRecord(
  input: CreateRecordInput,
  targetCount: number,
): SaveRecordResult {
  const recordNumber = mockGetNextRecordNumber(input.projectId)
  const ts = mockNowIso()

  const record: JournalRecord = {
    id: newMockId(),
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

  mockStore.records.push(record)
  return buildSaveResult(record, input.projectId, targetCount)
}

export function mockUpdateRecord(
  id: string,
  userId: string,
  projectId: string,
  input: UpdateRecordInput,
  targetCount: number,
): SaveRecordResult {
  const index = mockStore.records.findIndex((r) => r.id === id && r.user_id === userId)
  if (index < 0) throw new Error('기록을 찾을 수 없어요.')

  const updated: JournalRecord = {
    ...mockStore.records[index],
    content: input.content ?? mockStore.records[index].content,
    title: input.title !== undefined ? input.title : mockStore.records[index].title,
    photo_url:
      input.photoUrl !== undefined ? input.photoUrl : mockStore.records[index].photo_url,
    emotion_tags: input.emotionTags ?? mockStore.records[index].emotion_tags,
    question_text:
      input.questionText !== undefined
        ? input.questionText
        : mockStore.records[index].question_text,
    updated_at: mockNowIso(),
  }

  mockStore.records[index] = updated
  return buildSaveResult(updated, projectId, targetCount)
}

export function mockDeleteRecord(id: string, userId: string): void {
  mockStore.records = mockStore.records.filter(
    (r) => !(r.id === id && r.user_id === userId),
  )
}

export function mockUploadRecordPhoto(_userId: string, _projectId: string, file: File): string {
  return `mock/${file.name}`
}

export function mockGetPhotoSignedUrl(_path: string): string | null {
  return null
}

export function mockGetUnassignedRecordCount(projectId: string): number {
  return mockStore.records.filter(
    (r) => r.project_id === projectId && !r.is_draft && r.chapter_id === null,
  ).length
}
