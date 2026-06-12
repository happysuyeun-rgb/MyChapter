import type { RecordFrequency } from '@/types/database'

export type PeriodDays = 30 | 100 | 180 | 365

const RECORDS_PER_WEEK: Record<RecordFrequency, number> = {
  daily: 7,
  week5: 5,
  week3: 3,
  week1: 1,
}

export interface RoutineResult {
  targetCount: number
  estimatedPages: number
  targetDate: Date
}

export function calculateRoutine(
  periodDays: PeriodDays,
  frequency: RecordFrequency,
  startDate = new Date(),
): RoutineResult {
  const weeks = periodDays / 7
  const targetCount = Math.ceil(weeks * RECORDS_PER_WEEK[frequency])
  const estimatedPages = Math.ceil(targetCount * 1.2)
  const targetDate = new Date(startDate)
  targetDate.setDate(targetDate.getDate() + periodDays)

  return { targetCount, estimatedPages, targetDate }
}

export function formatDateKo(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
