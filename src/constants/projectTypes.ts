import type { ProjectType, RecordFrequency } from '@/types/database'

export interface ProjectTypeMeta {
  type: ProjectType
  emoji: string
  label: string
  description: string
  defaultTitle: string
  defaultPeriodDays: 30 | 100 | 180 | 365
  defaultFrequency: RecordFrequency
}

export const PROJECT_TYPES: ProjectTypeMeta[] = [
  {
    type: 'emotion',
    emoji: '🌿',
    label: '감정 성장기',
    description: '100일간의 감정 기록으로 만드는 나만의 에세이',
    defaultTitle: '나의 100일 감정 여행',
    defaultPeriodDays: 100,
    defaultFrequency: 'week5',
  },
  {
    type: 'parenting',
    emoji: '👶',
    label: '육아 성장북',
    description: '아이의 소중한 순간을 담은 성장 앨범',
    defaultTitle: '우리 아이 성장 기록',
    defaultPeriodDays: 365,
    defaultFrequency: 'week3',
  },
  {
    type: 'yearly',
    emoji: '⭐',
    label: '올해의 나',
    description: '1년간의 변화와 성장을 담은 연간 회고록',
    defaultTitle: '2026년, 나의 이야기',
    defaultPeriodDays: 365,
    defaultFrequency: 'week1',
  },
  {
    type: 'career',
    emoji: '🚀',
    label: '퇴사와 도전',
    description: '새 출발의 과정을 남기는 창업·이직 기록',
    defaultTitle: '새로운 시작의 기록',
    defaultPeriodDays: 100,
    defaultFrequency: 'week5',
  },
  {
    type: 'custom',
    emoji: '✏️',
    label: '직접 정의하기',
    description: '나만의 주제로 자유롭게 시작해요',
    defaultTitle: '나만의 책',
    defaultPeriodDays: 100,
    defaultFrequency: 'week5',
  },
]
