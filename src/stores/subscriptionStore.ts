import { create } from 'zustand'
import { getSubscriptionPlan } from '@/lib/api/subscriptions'
import type { SubscriptionPlan } from '@/types/database'

interface SubscriptionState {
  plan: SubscriptionPlan
  loading: boolean
  setPlan: (plan: SubscriptionPlan) => void
  refreshPlan: (userId: string) => Promise<SubscriptionPlan>
  reset: () => void
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plan: 'free',
  loading: false,

  setPlan: (plan) => set({ plan }),

  refreshPlan: async (userId) => {
    set({ loading: true })
    const plan = await getSubscriptionPlan(userId)
    set({ plan, loading: false })
    return plan
  },

  reset: () => set({ plan: 'free', loading: false }),
}))
