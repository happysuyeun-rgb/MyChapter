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
  isActiveProPlan,
  isProOnlyCover,
} from '../../supabase/functions/_shared/coverEntitlement.ts'
import {
  PUBLICATION_LIMIT_CODE,
  READY_AT_IMMUTABLE_CODE,
  STARTED_AT_IMMUTABLE_CODE,
  simulateDirectCoverUpdate,
  simulateDirectReadyAtUpdate,
  simulateDirectReadinessMinTamper,
  simulateDirectStartedAtUpdate,
  simulatePublicationEntitlement,
} from '@/lib/projectSecurityGuards'

const PROD_URL = `https://${PRODUCTION_SUPABASE_REF}.supabase.co`
const STAGING_URL = 'https://staging-example.supabase.co'
/** Fixed "now": 2026-10-24 */
const NOW = Date.parse('2026-10-24T12:00:00.000Z')
/** Exactly 30 inclusive calendar days before NOW → 2026-09-25 */
const STARTED_30_DAYS = '2026-09-25T00:00:00.000Z'
/** 29 inclusive calendar days before NOW → 2026-09-26 */
const STARTED_29_DAYS = '2026-09-26T00:00:00.000Z'

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

  it('rejects at 19 records boundary (20 required)', () => {
    const result = evaluateChapterReadinessGate({
      readyAt: '2026-10-01T00:00:00.000Z',
      recordCount: DEFAULT_MIN_RECORDS - 1,
      startedAt: STARTED_30_DAYS,
      nowMs: NOW,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.meetsVolume).toBe(false)
  })

  it('allows at exact 20 records boundary', () => {
    const result = evaluateChapterReadinessGate({
      readyAt: '2026-10-01T00:00:00.000Z',
      recordCount: DEFAULT_MIN_RECORDS,
      startedAt: STARTED_30_DAYS,
      nowMs: NOW,
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.elapsedDays).toBe(DEFAULT_MIN_DAYS)
  })

  it('rejects at 29 days boundary (30 required)', () => {
    const result = evaluateChapterReadinessGate({
      readyAt: '2026-10-01T00:00:00.000Z',
      recordCount: DEFAULT_MIN_RECORDS,
      startedAt: STARTED_29_DAYS,
      nowMs: NOW,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.elapsedDays).toBe(DEFAULT_MIN_DAYS - 1)
      expect(result.meetsVolume).toBe(false)
    }
  })

  it('allows at exact 30 days boundary', () => {
    const result = evaluateChapterReadinessGate({
      readyAt: '2026-10-01T00:00:00.000Z',
      recordCount: DEFAULT_MIN_RECORDS,
      startedAt: STARTED_30_DAYS,
      nowMs: NOW,
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.elapsedDays).toBe(DEFAULT_MIN_DAYS)
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

  it('blocks expired Pro on Pro covers', () => {
    expect(isActiveProPlan('pro', '2026-10-01T00:00:00.000Z', NOW)).toBe(false)
    expect(
      evaluateCoverEntitlement('cover_03', 'pro', {
        expiresAt: '2026-10-01T00:00:00.000Z',
        nowMs: NOW,
      }).ok,
    ).toBe(false)
  })

  it('allows active Pro with future expires_at', () => {
    expect(
      evaluateCoverEntitlement('cover_04', 'pro', {
        expiresAt: '2026-12-01T00:00:00.000Z',
        nowMs: NOW,
      }).ok,
    ).toBe(true)
  })

  it('allows Pro with null expires_at (lifetime)', () => {
    expect(evaluateCoverEntitlement('cover_03', 'pro', { expiresAt: null, nowMs: NOW }).ok).toBe(
      true,
    )
  })
})

describe('direct API privilege bypass guards (DB-025 mirrors)', () => {
  it('blocks Free REST UPDATE of selected_cover_id=cover_03', () => {
    expect(
      simulateDirectCoverUpdate({ coverId: 'cover_03', plan: 'free', nowMs: NOW }),
    ).toEqual({ ok: false, code: COVER_PRO_ONLY_CODE })
  })

  it('blocks Free REST UPDATE of cover_04', () => {
    expect(simulateDirectCoverUpdate({ coverId: 'cover_04', plan: 'free' }).ok).toBe(false)
  })

  it('allows Pro REST UPDATE of cover_03 when subscription active', () => {
    expect(
      simulateDirectCoverUpdate({
        coverId: 'cover_03',
        plan: 'pro',
        expiresAt: '2026-12-01T00:00:00.000Z',
        nowMs: NOW,
      }).ok,
    ).toBe(true)
  })

  it('blocks expired-Pro REST UPDATE of cover_03', () => {
    expect(
      simulateDirectCoverUpdate({
        coverId: 'cover_03',
        plan: 'pro',
        expiresAt: '2026-09-01T00:00:00.000Z',
        nowMs: NOW,
      }),
    ).toEqual({ ok: false, code: COVER_PRO_ONLY_CODE })
  })

  it('allows Free REST UPDATE of free covers', () => {
    expect(simulateDirectCoverUpdate({ coverId: 'cover_01', plan: 'free' }).ok).toBe(true)
  })

  it('blocks ready_at stamp via REST when under 20/30', () => {
    expect(
      simulateDirectReadyAtUpdate({
        readyAt: new Date(NOW).toISOString(),
        previousReadyAt: null,
        recordCount: 19,
        startedAt: STARTED_30_DAYS,
        nowMs: NOW,
      }),
    ).toEqual({ ok: false, code: BOOK_NOT_READY_CODE })
  })

  it('allows ready_at stamp via REST at exact 20/30', () => {
    expect(
      simulateDirectReadyAtUpdate({
        readyAt: new Date(NOW).toISOString(),
        previousReadyAt: null,
        recordCount: 20,
        startedAt: STARTED_30_DAYS,
        nowMs: NOW,
      }).ok,
    ).toBe(true)
  })

  it('blocks clearing or rewriting ready_at via REST', () => {
    expect(
      simulateDirectReadyAtUpdate({
        readyAt: null,
        previousReadyAt: '2026-10-01T00:00:00.000Z',
        recordCount: 50,
        startedAt: STARTED_30_DAYS,
        nowMs: NOW,
      }),
    ).toEqual({ ok: false, code: READY_AT_IMMUTABLE_CODE })

    expect(
      simulateDirectReadyAtUpdate({
        readyAt: '2026-10-20T00:00:00.000Z',
        previousReadyAt: '2026-10-01T00:00:00.000Z',
        recordCount: 50,
        startedAt: STARTED_30_DAYS,
        nowMs: NOW,
      }),
    ).toEqual({ ok: false, code: READY_AT_IMMUTABLE_CODE })
  })

  it('blocks started_at backdate via REST', () => {
    expect(
      simulateDirectStartedAtUpdate({
        previousStartedAt: '2026-10-01',
        nextStartedAt: '2026-01-01',
      }),
    ).toEqual({ ok: false, code: STARTED_AT_IMMUTABLE_CODE })
  })

  it('restores type readiness mins when client weakens thresholds', () => {
    const result = simulateDirectReadinessMinTamper('custom', {
      minDays: 1,
      minRecords: 1,
    })
    expect(result.wasWeakened).toBe(true)
    expect(result.minDays).toBe(30)
    expect(result.minRecords).toBe(20)
  })
})

describe('publication entitlement — active Pro vs expired Pro (AUTH-03)', () => {
  it('allows Free first publication (no prior published)', () => {
    expect(
      simulatePublicationEntitlement({
        plan: 'free',
        publishedCount: 0,
        nowMs: NOW,
      }).ok,
    ).toBe(true)
  })

  it('blocks Free second publication with PUBLICATION_LIMIT', () => {
    expect(
      simulatePublicationEntitlement({
        plan: 'free',
        publishedCount: 1,
        nowMs: NOW,
      }),
    ).toEqual({ ok: false, code: PUBLICATION_LIMIT_CODE, isActivePro: false })
  })

  it('allows active Pro unlimited publications (prior published ok)', () => {
    const result = simulatePublicationEntitlement({
      plan: 'pro',
      expiresAt: '2026-12-01T00:00:00.000Z',
      publishedCount: 3,
      nowMs: NOW,
    })
    expect(result).toEqual({ ok: true, isActivePro: true })
  })

  it('allows lifetime Pro (null expires_at) with prior published', () => {
    expect(
      simulatePublicationEntitlement({
        plan: 'pro',
        expiresAt: null,
        publishedCount: 2,
        nowMs: NOW,
      }).ok,
    ).toBe(true)
  })

  it('blocks expired Pro with prior published as PUBLICATION_LIMIT', () => {
    expect(
      simulatePublicationEntitlement({
        plan: 'pro',
        expiresAt: '2026-09-01T00:00:00.000Z',
        publishedCount: 1,
        nowMs: NOW,
      }),
    ).toEqual({ ok: false, code: PUBLICATION_LIMIT_CODE, isActivePro: false })
  })

  it('allows expired Pro first publication when no prior published', () => {
    expect(
      simulatePublicationEntitlement({
        plan: 'pro',
        expiresAt: '2026-09-01T00:00:00.000Z',
        publishedCount: 0,
        nowMs: NOW,
      }).ok,
    ).toBe(true)
  })
})
