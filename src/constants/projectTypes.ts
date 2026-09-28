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
  { type: 'growth', emoji: '🌱', label: '나의 성장', description: '변화와 마음의 성장을 한 권에 담아요', defaultTitle: '나의 성장 기록', defaultPeriodDays: 100, defaultFrequency: 'week5' },
  { type: 'life_story', emoji: '📖', label: '나의 이야기', description: '지나온 삶과 기억을 나만의 이야기로 엮어요', defaultTitle: '나의 이야기', defaultPeriodDays: 180, defaultFrequency: 'week3' },
  { type: 'career', emoji: '💼', label: '일과 커리어', description: '일, 선택, 도전과 성취의 과정을 기록해요', defaultTitle: '일하며 성장한 시간', defaultPeriodDays: 100, defaultFrequency: 'week3' },
  { type: 'parenting', emoji: '🏡', label: '가족과 육아', description: '가족과 아이의 소중한 시간을 남겨요', defaultTitle: '우리 가족의 이야기', defaultPeriodDays: 100, defaultFrequency: 'week3' },
  { type: 'relationships', emoji: '♡', label: '사랑과 관계', description: '사람과 관계 속에서 생긴 이야기를 담아요', defaultTitle: '사랑과 관계의 기록', defaultPeriodDays: 100, defaultFrequency: 'week3' },
  { type: 'travel', emoji: '✈', label: '여행과 모험', description: '여행의 장면과 감정을 한 권의 여행기로 만들어요', defaultTitle: '여행이 남긴 시간', defaultPeriodDays: 30, defaultFrequency: 'daily' },
  { type: 'hobby', emoji: '☕', label: '취미와 일상', description: '좋아하는 것과 평범한 하루를 차곡차곡 모아요', defaultTitle: '좋아하는 날들의 기록', defaultPeriodDays: 30, defaultFrequency: 'week5' },
  { type: 'learning', emoji: '✎', label: '배움과 도전', description: '배우고 시도하며 달라지는 과정을 기록해요', defaultTitle: '배움과 도전의 기록', defaultPeriodDays: 100, defaultFrequency: 'week3' },
  { type: 'custom', emoji: '∞', label: '자유 기록', description: '정해진 주제 없이 나만의 방식으로 시작해요', defaultTitle: '나만의 책', defaultPeriodDays: 100, defaultFrequency: 'week5' },
]

// Legacy types remain readable so existing projects continue to render safely.
export const LEGACY_PROJECT_LABELS: Partial<Record<ProjectType, string>> = {
  emotion: '감정 성장기',
  yearly: '올해의 나',
}
