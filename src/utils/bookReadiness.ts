import type { Project, ProjectType } from '@/types/database'

export interface BookReadinessRule {
  minDays: number
  minRecords: number
  targetDays: number
  targetRecords: number
}

export interface BookReadiness {
  score: number
  elapsedDays: number
  recordCount: number
  rule: BookReadinessRule
  isReady: boolean
  daysRemaining: number
  recordsRemaining: number
  message: string
}

const DEFAULT_RULE: BookReadinessRule = {
  minDays: 30,
  minRecords: 20,
  targetDays: 60,
  targetRecords: 30,
}

export const BOOK_READINESS_RULES: Partial<Record<ProjectType, BookReadinessRule>> = {
  growth: { minDays: 60, minRecords: 30, targetDays: 90, targetRecords: 40 },
  life_story: { minDays: 90, minRecords: 40, targetDays: 180, targetRecords: 60 },
  career: { minDays: 60, minRecords: 30, targetDays: 90, targetRecords: 40 },
  parenting: { minDays: 30, minRecords: 30, targetDays: 90, targetRecords: 45 },
  relationships: { minDays: 30, minRecords: 25, targetDays: 90, targetRecords: 40 },
  travel: { minDays: 7, minRecords: 10, targetDays: 15, targetRecords: 15 },
  hobby: { minDays: 30, minRecords: 20, targetDays: 60, targetRecords: 30 },
  learning: { minDays: 30, minRecords: 20, targetDays: 90, targetRecords: 35 },
  custom: { minDays: 30, minRecords: 20, targetDays: 60, targetRecords: 30 },
  emotion: { minDays: 30, minRecords: 20, targetDays: 60, targetRecords: 30 },
  yearly: { minDays: 60, minRecords: 30, targetDays: 100, targetRecords: 40 },
}

function daysSince(dateString: string): number {
  const start = new Date(dateString)
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1)
}

export function getBookReadiness(project: Project, recordCount: number): BookReadiness {
  const rule = BOOK_READINESS_RULES[project.type] ?? DEFAULT_RULE
  const elapsedDays = daysSince(project.started_at || project.created_at)
  const dayProgress = Math.min(1, elapsedDays / rule.targetDays)
  const recordProgress = Math.min(1, recordCount / rule.targetRecords)

  // MVP readiness combines time and material volume. Richer AI story-quality
  // signals can be layered on later without changing the user-facing gate.
  const score = Math.min(100, Math.round((dayProgress * 0.35 + recordProgress * 0.65) * 100))
  const daysRemaining = Math.max(0, rule.minDays - elapsedDays)
  const recordsRemaining = Math.max(0, rule.minRecords - recordCount)
  const isReady = daysRemaining === 0 && recordsRemaining === 0

  let message = '첫 페이지를 기다리고 있어요.'
  if (recordCount > 0 && !isReady) message = 'PAGE가 책이 될 이야기들을 모으고 있어요.'
  if (score >= 60 && !isReady) message = '책의 윤곽이 조금씩 보이고 있어요.'
  if (isReady) message = '한 권의 이야기를 만들 준비가 되었어요.'

  return { score, elapsedDays, recordCount, rule, isReady, daysRemaining, recordsRemaining, message }
}
