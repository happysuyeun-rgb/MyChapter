/**
 * Pure mirrors of supabase/migrations/025_enforce_cover_and_readiness_guards.sql
 * for unit-testing REST/API bypass paths without a live Postgres.
 */

import {
  COVER_PRO_ONLY_CODE,
  evaluateCoverEntitlement,
  isActiveProPlan,
  type CoverEntitlementOptions,
} from '@/lib/coverEntitlement'
import {
  BOOK_NOT_READY_CODE,
  DEFAULT_MIN_DAYS,
  DEFAULT_MIN_RECORDS,
  elapsedDaysSince,
} from '../../supabase/functions/_shared/chapterReadinessGate.ts'

export const STARTED_AT_IMMUTABLE_CODE = 'STARTED_AT_IMMUTABLE'
export const READY_AT_IMMUTABLE_CODE = 'READY_AT_IMMUTABLE'
export const STARTED_AT_INVALID_CODE = 'STARTED_AT_INVALID'

export type SimulatedCoverUpdateInput = {
  coverId: string
  plan: string | null | undefined
  expiresAt?: string | null
  nowMs?: number
}

/** Simulates projects BEFORE UPDATE cover entitlement trigger for authenticated clients. */
export function simulateDirectCoverUpdate(
  input: SimulatedCoverUpdateInput,
): { ok: true } | { ok: false; code: typeof COVER_PRO_ONLY_CODE } {
  const options: CoverEntitlementOptions = {
    expiresAt: input.expiresAt,
    nowMs: input.nowMs,
  }
  return evaluateCoverEntitlement(input.coverId, input.plan, options)
}

export type SimulatedReadyAtStampInput = {
  readyAt: string | null
  previousReadyAt?: string | null
  recordCount: number
  startedAt: string
  minRecords?: number
  minDays?: number
  nowMs?: number
  /** When false, mimics service-role path that skips client guards. */
  asAuthenticatedClient?: boolean
}

export type SimulatedReadyAtResult =
  | { ok: true }
  | {
      ok: false
      code:
        | typeof BOOK_NOT_READY_CODE
        | typeof READY_AT_IMMUTABLE_CODE
        | typeof STARTED_AT_IMMUTABLE_CODE
    }

/**
 * Simulates authenticated clients stamping/changing ready_at via REST.
 * Matches 025 integrity rules for the ready_at transition.
 */
export function simulateDirectReadyAtUpdate(
  input: SimulatedReadyAtStampInput,
): SimulatedReadyAtResult {
  const asClient = input.asAuthenticatedClient !== false
  if (!asClient) return { ok: true }

  const previous = input.previousReadyAt ?? null
  if (previous != null && input.readyAt == null) {
    return { ok: false, code: READY_AT_IMMUTABLE_CODE }
  }
  if (previous != null && input.readyAt != null && previous !== input.readyAt) {
    return { ok: false, code: READY_AT_IMMUTABLE_CODE }
  }
  if (input.readyAt == null) return { ok: true }

  // First stamp: volume/time must already be met (anti-tamper).
  if (previous == null) {
    const minRecords = input.minRecords ?? DEFAULT_MIN_RECORDS
    const minDays = input.minDays ?? DEFAULT_MIN_DAYS
    const elapsed = elapsedDaysSince(input.startedAt, input.nowMs)
    if (input.recordCount < minRecords || elapsed < minDays) {
      return { ok: false, code: BOOK_NOT_READY_CODE }
    }
  }
  return { ok: true }
}

export type SimulatedStartedAtChangeInput = {
  previousStartedAt: string
  nextStartedAt: string
  asAuthenticatedClient?: boolean
}

export function simulateDirectStartedAtUpdate(
  input: SimulatedStartedAtChangeInput,
): { ok: true } | { ok: false; code: typeof STARTED_AT_IMMUTABLE_CODE } {
  if (input.asAuthenticatedClient === false) return { ok: true }
  if (input.previousStartedAt !== input.nextStartedAt) {
    return { ok: false, code: STARTED_AT_IMMUTABLE_CODE }
  }
  return { ok: true }
}

/** Type policy floors — mirrors private.readiness_defaults_for_type for `custom`/default. */
export function applyReadinessTypeDefaults(type: string): {
  minDays: number
  minRecords: number
} {
  switch (type) {
    case 'growth':
      return { minDays: 60, minRecords: 30 }
    case 'life_story':
      return { minDays: 90, minRecords: 40 }
    case 'career':
      return { minDays: 60, minRecords: 30 }
    case 'parenting':
      return { minDays: 30, minRecords: 30 }
    case 'relationships':
      return { minDays: 30, minRecords: 25 }
    case 'travel':
      return { minDays: 7, minRecords: 10 }
    case 'hobby':
      return { minDays: 30, minRecords: 20 }
    case 'learning':
      return { minDays: 30, minRecords: 20 }
    case 'yearly':
      return { minDays: 60, minRecords: 30 }
    default:
      return { minDays: 30, minRecords: 20 }
  }
}

/**
 * Clients cannot invent weaker thresholds; type policy wins (025 trigger).
 */
export function simulateDirectReadinessMinTamper(
  type: string,
  attempted: { minDays: number; minRecords: number },
): { minDays: number; minRecords: number; wasWeakened: boolean } {
  const defaults = applyReadinessTypeDefaults(type)
  const wasWeakened =
    attempted.minDays < defaults.minDays || attempted.minRecords < defaults.minRecords
  return { ...defaults, wasWeakened }
}

export const PUBLICATION_LIMIT_CODE = 'PUBLICATION_LIMIT'
export const PUBLICATION_IN_PROGRESS_CODE = 'PUBLICATION_IN_PROGRESS'

export type SimulatedPublicationReserveInput = {
  plan: string | null | undefined
  expiresAt?: string | null
  nowMs?: number
  /** Existing published rows for this user (any project). */
  publishedCount: number
  /** Whether another project already holds a processing reservation. */
  otherProjectProcessing?: boolean
}

/**
 * Mirrors private.reserve_book_publication Free/expired-Pro slot checks
 * (active Pro via user_has_active_pro).
 */
export function simulatePublicationEntitlement(
  input: SimulatedPublicationReserveInput,
):
  | { ok: true; isActivePro: boolean }
  | {
      ok: false
      code: typeof PUBLICATION_LIMIT_CODE | typeof PUBLICATION_IN_PROGRESS_CODE
      isActivePro: boolean
    } {
  const isActivePro = isActiveProPlan(input.plan, input.expiresAt, input.nowMs)
  if (!isActivePro && input.publishedCount > 0) {
    return { ok: false, code: PUBLICATION_LIMIT_CODE, isActivePro }
  }
  if (!isActivePro && input.otherProjectProcessing) {
    return { ok: false, code: PUBLICATION_IN_PROGRESS_CODE, isActivePro }
  }
  return { ok: true, isActivePro }
}
