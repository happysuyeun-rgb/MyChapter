import type { Session, User } from '@supabase/supabase-js'
import type { Project, UserProfile } from '@/types/database'

export const DEV_MOCK_USER_ID = '00000000-0000-4000-8000-000000000001'
export const DEV_MOCK_PROJECT_ID = '00000000-0000-4000-8000-000000000002'

const NOW = '2026-06-12T00:00:00.000Z'

export const DEV_MOCK_USER = {
  id: DEV_MOCK_USER_ID,
  email: 'dev@mychapter.local',
  app_metadata: {},
  user_metadata: { nickname: '서아' },
  aud: 'authenticated',
  created_at: NOW,
} as User

export const DEV_MOCK_SESSION = {
  access_token: 'dev-bypass-token',
  refresh_token: 'dev-bypass-refresh',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: DEV_MOCK_USER,
} as Session

export const DEV_MOCK_PROFILE: UserProfile = {
  id: DEV_MOCK_USER_ID,
  nickname: '서아',
  profile_emoji: '🌿',
  notification_enabled: true,
  notification_time: '21:00:00',
  onboarding_completed: true,
  created_at: NOW,
  updated_at: NOW,
}

export const DEV_MOCK_PROJECT: Project = {
  id: DEV_MOCK_PROJECT_ID,
  user_id: DEV_MOCK_USER_ID,
  type: 'emotion',
  title: '나의 100일 감정 여행',
  target_count: 72,
  frequency: 'week5',
  notification_time: '21:00:00',
  record_mode: 'question',
  cover_template_id: null,
  is_completed: false,
  started_at: '2026-06-01',
  target_date: '2026-09-09',
  created_at: NOW,
  updated_at: NOW,
}

export const DEV_MOCK_TODAY_QUESTION =
  '오늘 하루 중 가장 선명하게 남는 감정의 순간은 언제인가요?'

export function isDevBypass(): boolean {
  return import.meta.env.VITE_DEV_BYPASS === 'true'
}
