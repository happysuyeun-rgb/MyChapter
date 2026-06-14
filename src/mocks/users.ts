import { mockNowIso, mockStore } from '@/mocks/state'
import type { UserProfile } from '@/types/database'

export function mockUpdateNickname(_userId: string, nickname: string): UserProfile {
  mockStore.profile = { ...mockStore.profile, nickname, updated_at: mockNowIso() }
  return mockStore.profile
}

export function mockUpdateProfileEmoji(_userId: string, profileEmoji: string): UserProfile {
  mockStore.profile = { ...mockStore.profile, profile_emoji: profileEmoji, updated_at: mockNowIso() }
  return mockStore.profile
}

export function mockUpdateNotificationSettings(
  _userId: string,
  settings: { notification_enabled?: boolean; notification_time?: string },
): UserProfile {
  mockStore.profile = {
    ...mockStore.profile,
    ...settings,
    updated_at: mockNowIso(),
  }
  return mockStore.profile
}

export function mockGetProfile(): UserProfile {
  return { ...mockStore.profile }
}
