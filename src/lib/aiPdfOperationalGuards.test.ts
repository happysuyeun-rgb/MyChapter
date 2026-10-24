import { describe, expect, it } from 'vitest'
import {
  canAcceptDevBillingToken,
  DEV_BILLING_FORBIDDEN_CODE,
  isProductionBillingEnvironment,
  PRODUCTION_SUPABASE_REF,
} from '../../supabase/functions/_shared/billingDevBypass.ts'
import {
  BOOK_NOT_READY_CODE,
  DEFAULT_MIN_DAYS,
  DEFAULT_MIN_RECORDS,
  evaluateChapterReadinessGate,
} from '../../supabase/functions/_shared/chapterReadinessGate.ts'
import {
  COVER_PRO_ONLY_CODE,
  evaluateCoverEntitlement,
  isProOnlyCover,
} from '../../supabase/functions/_shared/coverEntitlement.ts'

const PROD_URL = `https://${PRODUCTION_SUPABASE_REF}.supabase.co`
const STAGING_URL = 'https://staging-example.supabase.co'
/** Fixed "now": 2026-10-24 */
const NOW = Date.parse('2026-10-24T12:00:00.000Z')

describe('chapter readiness gate (AUTH-01)', () => {
  it('rejects when ready_at missing even if volume looks high', () => {
    const result = evaluateChapterReadinessGate({
      readyAt: null,
      recordCount: 25,
      startedAt: '2026-08-01T00:00:00.000Z',
      nowMs: NOW,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe(BOOK_NOT_READY_CODE)
  })

  it('rejects Work-like underprepared book (4 records / 1 day)', () => {
    const result = evaluateChapterReadinessGate({
      readyAt: null,
      recordCount: 4,
      startedAt: '2026-10-23T00:00:00.000Z',
      nowMs: NOW,
    })
    expect(result.ok).toBe(false)
  })

  it('rejects ready_at stamp without meeting 20/30 thresholds (tamper)', () => {
    const result = evaluateChapterReadinessGate({
      readyAt: '2026-10-01T00:00:00.000Z',
      recordCount: 4,
      startedAt: '2026-10-20T00:00:00.000Z',
      nowMs: NOW,
    })
    expect(result.ok).toBe(false)
  })

  it('allows when ready_at set and defaults 20 records / 30 days met', () => {
    const result = evaluateChapterReadinessGate({
      readyAt: '2026-10-01T00:00:00.000Z',
      recordCount: DEFAULT_MIN_RECORDS,
      startedAt: '2026-09-01T00:00:00.000Z',
      nowMs: NOW,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.minRecords).toBe(DEFAULT_MIN_RECORDS)
      expect(result.minDays).toBe(DEFAULT_MIN_DAYS)
      expect(result.elapsedDays).toBeGreaterThanOrEqual(DEFAULT_MIN_DAYS)
    }
  })
})

describe('billing dev bypass fail-closed (SEC-01)', () => {
  it('blocks production host even when bypass secret is true', () => {
    expect(isProductionBillingEnvironment({ supabaseUrl: PROD_URL })).toBe(true)
    expect(
      canAcceptDevBillingToken({
        billingDevBypass: true,
        billingDevBypassAllow: true,
        supabaseUrl: PROD_URL,
      }),
    ).toBe(false)
  })

  it('blocks MYCHAPTER_ENV=production', () => {
    expect(
      canAcceptDevBillingToken({
        billingDevBypass: true,
        billingDevBypassAllow: true,
        supabaseUrl: STAGING_URL,
        mychapterEnv: 'production',
      }),
    ).toBe(false)
  })

  it('blocks non-prod when ALLOW flag missing', () => {
    expect(
      canAcceptDevBillingToken({
        billingDevBypass: true,
        billingDevBypassAllow: false,
        supabaseUrl: STAGING_URL,
      }),
    ).toBe(false)
  })

  it('allows isolated non-prod only with bypass + allow', () => {
    expect(
      canAcceptDevBillingToken({
        billingDevBypass: true,
        billingDevBypassAllow: true,
        supabaseUrl: STAGING_URL,
        mychapterEnv: 'staging',
      }),
    ).toBe(true)
  })

  it('exposes forbidden code constant for Edge responses', () => {
    expect(DEV_BILLING_FORBIDDEN_CODE).toBe('DEV_BILLING_FORBIDDEN')
  })
})

describe('Pro cover entitlement (AUTH-02)', () => {
  it('marks cover_03/04 as pro-only', () => {
    expect(isProOnlyCover('cover_03')).toBe(true)
    expect(isProOnlyCover('cover_04')).toBe(true)
    expect(isProOnlyCover('cover_01')).toBe(false)
  })

  it('blocks Free plan on Pro covers', () => {
    expect(evaluateCoverEntitlement('cover_03', 'free')).toEqual({
      ok: false,
      code: COVER_PRO_ONLY_CODE,
    })
    expect(evaluateCoverEntitlement('cover_04', null).ok).toBe(false)
  })

  it('allows Pro plan and Free covers', () => {
    expect(evaluateCoverEntitlement('cover_03', 'pro').ok).toBe(true)
    expect(evaluateCoverEntitlement('cover_01', 'free').ok).toBe(true)
  })
})
