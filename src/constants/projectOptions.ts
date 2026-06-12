import type { RecordFrequency } from '@/types/database'
import type { PeriodDays } from '@/utils/calculateRoutine'

export const PERIOD_OPTIONS: { value: PeriodDays; label: string }[] = [
  { value: 30, label: '30일' },
  { value: 100, label: '100일' },
  { value: 180, label: '6개월' },
  { value: 365, label: '1년' },
]

export const FREQUENCY_OPTIONS: { value: RecordFrequency; label: string }[] = [
  { value: 'daily', label: '매일' },
  { value: 'week5', label: '주 5회' },
  { value: 'week3', label: '주 3회' },
  { value: 'week1', label: '주 1회' },
]

export const NOTIFICATION_TIME_OPTIONS = [
  { value: '08:00', label: '아침 8:00' },
  { value: '12:00', label: '점심 12:00' },
  { value: '18:00', label: '저녁 6:00' },
  { value: '21:00', label: '저녁 9:00' },
]
