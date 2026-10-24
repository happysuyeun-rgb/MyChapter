/**
 * Fail-closed guard for verify-subscription dev tokens (SEC-01).
 * Production host / MYCHAPTER_ENV=production never accepts bypass,
 * even if BILLING_DEV_BYPASS=true. Non-prod also requires explicit ALLOW.
 */

export const DEV_BILLING_FORBIDDEN_CODE = 'DEV_BILLING_FORBIDDEN'
export const DEV_BILLING_FORBIDDEN_MESSAGE = '개발용 결제는 이 환경에서 사용할 수 없어요.'

/** Known MyChapter production Supabase project ref (URL substring). */
export const PRODUCTION_SUPABASE_REF = 'rdrafwfdwfzgcfiqkgug'

export type BillingDevBypassInput = {
  billingDevBypass: boolean
  /** Second lock — must be true on non-prod for bypass to work. */
  billingDevBypassAllow: boolean
  supabaseUrl: string
  mychapterEnv?: string | null
  productionRef?: string
}

export function isProductionBillingEnvironment(input: {
  supabaseUrl: string
  mychapterEnv?: string | null
  productionRef?: string
}): boolean {
  const env = (input.mychapterEnv ?? '').trim().toLowerCase()
  if (env === 'production' || env === 'prod') return true
  const ref = input.productionRef ?? PRODUCTION_SUPABASE_REF
  return input.supabaseUrl.toLowerCase().includes(ref.toLowerCase())
}

/** Returns true only when a `dev_` purchase token may grant Pro. */
export function canAcceptDevBillingToken(input: BillingDevBypassInput): boolean {
  if (!input.billingDevBypass) return false
  if (
    isProductionBillingEnvironment({
      supabaseUrl: input.supabaseUrl,
      mychapterEnv: input.mychapterEnv,
      productionRef: input.productionRef,
    })
  ) {
    return false
  }
  return input.billingDevBypassAllow === true
}
