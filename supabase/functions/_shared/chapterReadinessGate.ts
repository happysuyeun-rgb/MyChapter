/**
 * Server-side story readiness for chapter generation (AUTH-01).
 * Defaults match product DEFAULT_RULE: 20 records · 30 days · ready_at stamped.
 */

export const BOOK_NOT_READY_CODE = 'BOOK_NOT_READY'
export const BOOK_NOT_READY_MESSAGE =
  '아직 책 만들기 준비가 되지 않았어요. 기록과 기간이 충분히 쌓인 뒤 다시 시도해주세요.'

export const DEFAULT_MIN_RECORDS = 20
export const DEFAULT_MIN_DAYS = 30

export type ChapterReadinessGateInput = {
  readyAt: string | null | undefined
  recordCount: number
  startedAt: string
  minRecords?: number | null
  minDays?: number | null
  /** Injectable clock for tests (ms since epoch). */
  nowMs?: number
}

export type ChapterReadinessGateResult =
  | { ok: true; elapsedDays: number; minRecords: number; minDays: number }
  | {
      ok: false
      code: typeof BOOK_NOT_READY_CODE
      elapsedDays: number
      minRecords: number
      minDays: number
      hasReadyAt: boolean
      meetsVolume: boolean
    }

export function elapsedDaysSince(startedAt: string, nowMs = Date.now()): number {
  const start = new Date(startedAt)
  const now = new Date(nowMs)
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1)
}

/**
 * Requires persisted ready_at AND volume/time thresholds (anti-tamper).
 */
export function evaluateChapterReadinessGate(
  input: ChapterReadinessGateInput,
): ChapterReadinessGateResult {
  const minRecords = input.minRecords ?? DEFAULT_MIN_RECORDS
  const minDays = input.minDays ?? DEFAULT_MIN_DAYS
  const elapsedDays = elapsedDaysSince(input.startedAt, input.nowMs)
  const hasReadyAt = Boolean(input.readyAt)
  const meetsVolume = input.recordCount >= minRecords && elapsedDays >= minDays

  if (hasReadyAt && meetsVolume) {
    return { ok: true, elapsedDays, minRecords, minDays }
  }

  return {
    ok: false,
    code: BOOK_NOT_READY_CODE,
    elapsedDays,
    minRecords,
    minDays,
    hasReadyAt,
    meetsVolume,
  }
}

export function bookNotReadyResponseBody(result: Extract<ChapterReadinessGateResult, { ok: false }>) {
  return {
    code: BOOK_NOT_READY_CODE,
    error: BOOK_NOT_READY_MESSAGE,
    ready_at: result.hasReadyAt,
    record_count_ok: result.meetsVolume,
    elapsed_days: result.elapsedDays,
    min_records: result.minRecords,
    min_days: result.minDays,
  }
}
