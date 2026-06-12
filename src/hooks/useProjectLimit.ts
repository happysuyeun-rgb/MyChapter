import { useEffect, useState } from 'react'
import { getProjectCount } from '@/lib/api/projects'
import { getSubscriptionPlan } from '@/lib/api/subscriptions'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'

interface ProjectLimitState {
  loading: boolean
  canCreate: boolean
  projectCount: number
  isPro: boolean
}

export function useProjectLimit(): ProjectLimitState {
  const { user } = useAuthStore()
  const { showPaywall } = usePaywallStore()
  const [state, setState] = useState<ProjectLimitState>({
    loading: true,
    canCreate: true,
    projectCount: 0,
    isPro: false,
  })

  useEffect(() => {
    if (!user) return

    const check = async () => {
      const [count, plan] = await Promise.all([
        getProjectCount(user.id),
        getSubscriptionPlan(user.id),
      ])

      const isPro = plan === 'pro'
      const canCreate = isPro || count < 1

      setState({
        loading: false,
        canCreate,
        projectCount: count,
        isPro,
      })

      if (!canCreate) {
        showPaywall()
      }
    }

    void check()
  }, [user, showPaywall])

  return state
}
