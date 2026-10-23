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

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plan: 'free',
  loading: false,

  setPlan: (plan) => set({ plan }),

  refreshPlan: async (userId) => {
    set({ loading: true })
    try {
      const plan = await getSubscriptionPlan(userId)
      set({ plan, loading: false })
      return plan
    } catch {
      // Keep last known plan instead of silently downgrading to Free.
      set({ loading: false })
      return get().plan
    }
  },

  reset: () => set({ plan: 'free', loading: false }),
}))
