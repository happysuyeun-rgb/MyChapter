import { MOCK_NOW } from '@/mocks/data'
import type { SubscriptionInfo } from '@/lib/api/subscriptions'
import type { SubscriptionPlan } from '@/types/database'

/** `VITE_MOCK_PLAN=free` previews Free quotas and Paywall in dev bypass. */
let mockPlan: SubscriptionPlan = import.meta.env.VITE_MOCK_PLAN === 'free' ? 'free' : 'pro'

export function mockGetSubscriptionPlan(): SubscriptionPlan {
  return mockPlan
}

export function mockGetSubscription(): SubscriptionInfo {
  return {
    plan: mockPlan,
    started_at: mockPlan === 'pro' ? MOCK_NOW : null,
    expires_at: null,
  }
}

export function mockVerifyPurchase(): SubscriptionPlan {
  mockPlan = 'pro'
  return mockPlan
}
