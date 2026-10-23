import { resolveFunctionPayload } from '@/lib/api/functionInvoke'
import { isDevBypass } from '@/lib/devBypass'
import {
  mockGetSubscription,
  mockGetSubscriptionPlan,
  mockVerifyPurchase,
} from '@/mocks'
import { supabase } from '@/lib/supabase'
import type { SubscriptionPlan } from '@/types/database'

export interface SubscriptionInfo {
  plan: SubscriptionPlan
  started_at: string | null
  expires_at: string | null
}

export class SubscriptionApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export async function getSubscriptionPlan(userId: string): Promise<SubscriptionPlan> {
  if (isDevBypass()) return mockGetSubscriptionPlan()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle()

  // Network/RLS failures must not be treated as Free (false Paywall).
  // A missing row is a legitimate Free plan.
  if (error) throw error

  return data?.plan ?? 'free'
}

export async function getSubscription(userId: string): Promise<SubscriptionInfo> {
  if (isDevBypass()) return mockGetSubscription()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, started_at, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  return {
    plan: data?.plan ?? 'free',
    started_at: data?.started_at ?? null,
    expires_at: data?.expires_at ?? null,
  }
}

export async function verifyPurchase(
  purchaseToken: string,
  productId: string,
  orderId?: string,
): Promise<SubscriptionPlan> {
  if (isDevBypass()) return mockVerifyPurchase()

  const response = await supabase.functions.invoke('verify-subscription', {
    body: {
      purchase_token: purchaseToken,
      product_id: productId,
      order_id: orderId,
    },
  })

  const { data, errorBody, error } = await resolveFunctionPayload<{
    plan?: SubscriptionPlan
    error?: string
    code?: string
  }>(response)

  const code = errorBody?.code ?? data?.code
  const message = errorBody?.error ?? data?.error

  if (error || message) {
    if (code === 'INVALID_PURCHASE') {
      throw new SubscriptionApiError('INVALID_PURCHASE', message ?? '유효하지 않은 구매 정보예요.')
    }
    throw new SubscriptionApiError(code ?? 'VERIFY_FAILED', message ?? '결제 검증에 실패했어요.')
  }

  return data?.plan ?? 'pro'
}
