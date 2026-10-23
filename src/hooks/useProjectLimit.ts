import { useEffect, useState } from 'react'
import { getProjectCount } from '@/lib/api/projects'
import { getSubscriptionPlan } from '@/lib/api/subscriptions'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

interface ProjectLimitState {
  loading: boolean
  error: boolean
  canCreate: boolean
  projectCount: number
  isPro: boolean
}

export function useProjectLimit(): ProjectLimitState {
  const { user } = useAuthStore()
  const [state, setState] = useState<ProjectLimitState>({
    loading: true,
    error: false,
    canCreate: true,
    projectCount: 0,
    isPro: false,
  })

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const check = async () => {
      setState((prev) => ({ ...prev, loading: true, error: false }))
      try {
        const [count, plan] = await Promise.all([
          getProjectCount(user.id),
          getSubscriptionPlan(user.id),
        ])
        if (cancelled) return

        const isPro = plan === 'pro'
        setState({
          loading: false,
          error: false,
          canCreate: isPro || count < 1,
          projectCount: count,
          isPro,
        })
      } catch {
        if (cancelled) return
        // Do not invent Free on failure — use last known plan from store.
        const isPro = useSubscriptionStore.getState().plan === 'pro'
        try {
          const count = await getProjectCount(user.id)
          if (cancelled) return
          setState({
            loading: false,
            error: false,
            canCreate: isPro || count < 1,
            projectCount: count,
            isPro,
          })
        } catch {
          if (cancelled) return
          setState({
            loading: false,
            error: true,
            canCreate: isPro,
            projectCount: 0,
            isPro,
          })
        }
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [user])

  return state
}
