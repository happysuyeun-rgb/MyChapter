import { MOCK_NOW } from '@/mocks/data'
import type { SubscriptionInfo } from '@/lib/api/subscriptions'
import type { SubscriptionPlan } from '@/types/database'

export function mockGetSubscriptionPlan(): SubscriptionPlan {
  return 'pro'
}

export function mockGetSubscription(): SubscriptionInfo {
  return {
    plan: 'pro',
    started_at: MOCK_NOW,
    expires_at: null,
  }
}

export function mockVerifyPurchase(): SubscriptionPlan {
  return 'pro'
}
