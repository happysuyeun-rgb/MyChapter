import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Project } from '@/types/database'
import { getBookReadiness } from './bookReadiness'

function project(overrides: Partial<Project>): Project {
  return {
    type: 'custom',
    started_at: '2026-10-06',
    created_at: '2026-10-06T00:00:00.000Z',
    ready_at: null,
    readiness_min_days: 30,
    readiness_min_records: 20,
    readiness_target_days: 60,
    readiness_target_records: 30,
    ...overrides,
  } as Project
}

describe('getBookReadiness elapsed days', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts UTC days so KST mornings match the server gate', () => {
    // 2026-11-05 08:30 KST is still 2026-11-04 in UTC.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-04T23:30:00.000Z'))
    const readiness = getBookReadiness(project({}), 20)
    expect(readiness.elapsedDays).toBe(30)
    expect(readiness.isReady).toBe(true)
  })

  it('is not ready one UTC day earlier', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-03T23:30:00.000Z'))
    const readiness = getBookReadiness(project({}), 20)
    expect(readiness.elapsedDays).toBe(29)
    expect(readiness.isReady).toBe(false)
    expect(readiness.daysRemaining).toBe(1)
  })
})
