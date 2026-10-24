/** Mirrors supabase/functions/_shared/coverEntitlement.ts for the web client. */

export const PRO_ONLY_COVER_IDS = ['cover_03', 'cover_04'] as const

export const COVER_PRO_ONLY_CODE = 'COVER_PRO_ONLY'

export function isProOnlyCover(coverId: string): boolean {
  return (PRO_ONLY_COVER_IDS as readonly string[]).includes(coverId)
}

export function isProPlan(plan: string | null | undefined): boolean {
  return plan === 'pro'
}

/** Active Pro: plan=pro and expires_at is null (lifetime) or still in the future. */
export function isActiveProPlan(
  plan: string | null | undefined,
  expiresAt?: string | null,
  nowMs = Date.now(),
): boolean {
  if (!isProPlan(plan)) return false
  if (expiresAt == null || expiresAt === '') return true
  const exp = Date.parse(expiresAt)
  if (Number.isNaN(exp)) return false
  return exp > nowMs
}

export type CoverEntitlementResult =
  | { ok: true }
  | { ok: false; code: typeof COVER_PRO_ONLY_CODE }

export type CoverEntitlementOptions = {
  expiresAt?: string | null
  nowMs?: number
}

export function evaluateCoverEntitlement(
  coverId: string,
  plan: string | null | undefined,
  options?: CoverEntitlementOptions,
): CoverEntitlementResult {
  if (!isProOnlyCover(coverId)) return { ok: true }
  if (isActiveProPlan(plan, options?.expiresAt, options?.nowMs)) return { ok: true }
  return { ok: false, code: COVER_PRO_ONLY_CODE }
}
