const KST_OFFSET_MS = 9 * 60 * 60 * 1000

function toKstDateString(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS)
  return kst.toISOString().slice(0, 10)
}

function parseKstDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+09:00`)
}

export function calculateStreak(records: { created_at: string }[]): number {
  if (records.length === 0) return 0

  const daysWithRecords = new Set(
    records.map((r) => toKstDateString(new Date(r.created_at))),
  )

  let streak = 0
  let cursor = parseKstDate(toKstDateString(new Date()))

  while (daysWithRecords.has(toKstDateString(cursor))) {
    streak++
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000)
  }

  return streak
}

export function getStreakMessage(streak: number): string | null {
  if (streak >= 30) return '30일 연속 기록 중!'
  if (streak >= 14) return '2주 연속 기록 중!'
  if (streak >= 7) return `${streak}일 연속 기록 중`
  if (streak >= 2) return `${streak}일 연속 기록 중`
  return null
}

export function getNextStreakGoal(streak: number): string | null {
  if (streak < 7) return `내일도 기록하면 ${7 - streak}일 후 1주 배지!`
  if (streak < 14) return '내일도 기록하면 2주 달성 배지!'
  if (streak < 30) return '내일도 기록하면 30일 배지!'
  return null
}
