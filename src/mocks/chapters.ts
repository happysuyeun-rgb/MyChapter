import { DEV_MOCK_USER_ID } from '@/mocks/data'
import { mockGetUnassignedRecordCount } from '@/mocks/records'
import { mockNowIso, mockStore, newMockId } from '@/mocks/state'
import type { Chapter } from '@/types/database'

const MOCK_CHAPTER_ID = '00000000-0000-4000-8000-000000000020'

export function mockListChapters(projectId: string): Chapter[] {
  return mockStore.chapters
    .filter((c) => c.project_id === projectId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function mockGetChapter(id: string): Chapter | null {
  return mockStore.chapters.find((c) => c.id === id) ?? null
}

export { mockGetUnassignedRecordCount }

export function mockUpdateChapterContent(
  chapterId: string,
  title: string,
  userContent: string,
): Chapter {
  const index = mockStore.chapters.findIndex((c) => c.id === chapterId)
  if (index < 0) throw new Error('챕터를 찾을 수 없어요.')

  const updated: Chapter = {
    ...mockStore.chapters[index],
    title,
    user_content: userContent,
    updated_at: mockNowIso(),
  }

  mockStore.chapters[index] = updated
  return updated
}

export function mockGenerateChapter(projectId: string): Chapter | null {
  const unassigned = mockStore.records.filter(
    (r) => r.project_id === projectId && !r.is_draft && r.chapter_id === null,
  )

  if (unassigned.length < 10) return null

  const batch = unassigned.slice(0, 10)
  const recordIds = batch.map((r) => r.id)
  const chapterNumber =
    mockStore.chapters.filter((c) => c.project_id === projectId).length + 1
  const ts = mockNowIso()

  const chapter: Chapter = {
    id: chapterNumber === 1 ? MOCK_CHAPTER_ID : newMockId(),
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

  mockStore.chapters.push(chapter)
  for (const recordId of recordIds) {
    const record = mockStore.records.find((r) => r.id === recordId)
    if (record) {
      record.chapter_id = chapter.id
      record.updated_at = ts
    }
  }

  return chapter
}

export function mockReorderChapters(_projectId: string, orderedChapterIds: string[]): void {
  for (const chapter of mockStore.chapters) {
    const index = orderedChapterIds.indexOf(chapter.id)
    if (index < 0) continue
    chapter.sort_order = index
    chapter.chapter_number = index + 1
    chapter.updated_at = mockNowIso()
  }
}

export function mockRegenerateChapter(chapterId: string): Chapter {
  const index = mockStore.chapters.findIndex((c) => c.id === chapterId)
  if (index < 0) throw new Error('챕터를 찾을 수 없어요.')

  const chapter = mockStore.chapters[index]
  const records = mockStore.records.filter((r) => chapter.record_ids.includes(r.id))
  const aiContent =
    records.length > 0
      ? records.map((r) => r.content).join('\n\n')
      : 'AI가 생성한 원고입니다.'

  const updated: Chapter = {
    ...chapter,
    ai_content: aiContent,
    user_content: null,
    updated_at: mockNowIso(),
  }

  mockStore.chapters[index] = updated
  return updated
}
