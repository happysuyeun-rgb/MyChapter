/** Pro-only covers — keep in sync with src/constants/coverTemplates.ts */

export const PRO_ONLY_COVER_IDS = ['cover_03', 'cover_04'] as const

export type ProOnlyCoverId = (typeof PRO_ONLY_COVER_IDS)[number]

export const COVER_PRO_ONLY_CODE = 'COVER_PRO_ONLY'
export const COVER_PRO_ONLY_MESSAGE = '이 표지는 Pro에서 사용할 수 있어요.'

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

export function coverProOnlyResponseBody() {
  return {
    code: COVER_PRO_ONLY_CODE,
    error: COVER_PRO_ONLY_MESSAGE,
  }
}
