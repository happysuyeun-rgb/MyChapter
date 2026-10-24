/** Mirrors supabase/functions/_shared/coverEntitlement.ts for the web client. */

export const PRO_ONLY_COVER_IDS = ['cover_03', 'cover_04'] as const

export const COVER_PRO_ONLY_CODE = 'COVER_PRO_ONLY'

export function isProOnlyCover(coverId: string): boolean {
  return (PRO_ONLY_COVER_IDS as readonly string[]).includes(coverId)
}

export function isProPlan(plan: string | null | undefined): boolean {
  return plan === 'pro'
}

export type CoverEntitlementResult =
  | { ok: true }
  | { ok: false; code: typeof COVER_PRO_ONLY_CODE }

export function evaluateCoverEntitlement(
  coverId: string,
  plan: string | null | undefined,
): CoverEntitlementResult {
  if (!isProOnlyCover(coverId)) return { ok: true }
  if (isProPlan(plan)) return { ok: true }
  return { ok: false, code: COVER_PRO_ONLY_CODE }
}
