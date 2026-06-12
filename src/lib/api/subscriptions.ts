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
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle()

  return data?.plan ?? 'free'
}

export async function getSubscription(userId: string): Promise<SubscriptionInfo> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, started_at, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

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
  const response = await supabase.functions.invoke('verify-subscription', {
    body: {
      purchase_token: purchaseToken,
      product_id: productId,
      order_id: orderId,
    },
  })

  const body = response.data as {
    plan?: SubscriptionPlan
    error?: string
    code?: string
  } | null

  if (response.error || body?.error) {
    throw new SubscriptionApiError(
      body?.code ?? 'VERIFY_FAILED',
      body?.error ?? '결제 검증에 실패했어요.',
    )
  }

  return body?.plan ?? 'pro'
}
