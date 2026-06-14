import type { Chapter, JournalRecord, Project, UserProfile } from '@/types/database'
import {
  DEV_MOCK_PROFILE,
  DEV_MOCK_PROJECT,
  INITIAL_MOCK_CHAPTERS,
  INITIAL_MOCK_NOTIFICATIONS,
  INITIAL_MOCK_RECORDS,
} from '@/mocks/data'

export function newMockId(): string {
  return crypto.randomUUID()
}

export function mockNowIso(): string {
  return new Date().toISOString()
}

export const mockStore = {
  profile: { ...DEV_MOCK_PROFILE } as UserProfile,
  projects: [{ ...DEV_MOCK_PROJECT }] as Project[],
  records: INITIAL_MOCK_RECORDS.map((r) => ({ ...r })) as JournalRecord[],
  chapters: [...INITIAL_MOCK_CHAPTERS] as Chapter[],
  notifications: INITIAL_MOCK_NOTIFICATIONS.map((n) => ({ ...n })),
}
