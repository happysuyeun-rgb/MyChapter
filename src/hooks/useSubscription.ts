import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

export function useSubscription() {
  const { user } = useAuthStore()
  const { plan, loading, refreshPlan, setPlan } = useSubscriptionStore()

  useEffect(() => {
    if (!user) return
    void refreshPlan(user.id)
  }, [user, refreshPlan])

  return {
    plan,
    isPro: plan === 'pro',
    loading,
    refreshPlan: () => (user ? refreshPlan(user.id) : Promise.resolve('free' as const)),
    setPlan,
  }
}
