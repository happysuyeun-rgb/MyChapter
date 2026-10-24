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

export function coverProOnlyResponseBody() {
  return {
    code: COVER_PRO_ONLY_CODE,
    error: COVER_PRO_ONLY_MESSAGE,
  }
}
