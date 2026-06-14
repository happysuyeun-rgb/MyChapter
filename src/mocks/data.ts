import type { Session, User } from '@supabase/supabase-js'
import type { Chapter, JournalRecord, Project, UserProfile } from '@/types/database'
import type { AppNotification } from '@/lib/api/notifications'

export const DEV_MOCK_USER_ID = '00000000-0000-4000-8000-000000000001'
export const DEV_MOCK_PROJECT_ID = '00000000-0000-4000-8000-000000000002'

export const MOCK_NOW = '2026-06-12T00:00:00.000Z'

export const DEV_MOCK_TODAY_QUESTION =
  '오늘 하루 중 가장 선명하게 남는 감정의 순간은 언제인가요?'

export const DEV_MOCK_USER = {
  id: DEV_MOCK_USER_ID,
  email: 'dev@mychapter.local',
  app_metadata: {},
  user_metadata: { nickname: '서아' },
  aud: 'authenticated',
  created_at: MOCK_NOW,
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
  created_at: MOCK_NOW,
  updated_at: MOCK_NOW,
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
  created_at: MOCK_NOW,
  updated_at: MOCK_NOW,
}

const MOCK_RECORD_IDS = [
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000012',
] as const

export const INITIAL_MOCK_RECORDS: JournalRecord[] = [
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

export const INITIAL_MOCK_CHAPTERS: Chapter[] = []

export const INITIAL_MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: '00000000-0000-4000-8000-000000000030',
    type: 'daily_question',
    title: '오늘의 기록',
    body: '오늘 하루, 한 줄만 적어볼까요?',
    link: '/home',
    is_read: false,
    created_at: '2026-06-12T08:00:00.000Z',
  },
]
