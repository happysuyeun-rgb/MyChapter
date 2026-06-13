import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isDevBypass } from '@/lib/devBypass'
import { useAuthStore } from '@/stores/authStore'

export function AuthGuard() {
  const { session, initialized, initialize } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (isDevBypass() && initialized && !session) {
      void initialize()
    }
  }, [initialized, session, initialize])

  if (!initialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  if (!session) {
    if (isDevBypass()) {
      return (
        <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
          로딩 중...
        </div>
      )
    }

    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function GuestGuard() {
  const { session, initialized } = useAuthStore()

  if (!initialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  if (session) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}

export function OnboardingGuard() {
  const { profile } = useAuthStore()

  if (isDevBypass()) {
    return <Outlet />
  }

  if (!profile?.onboarding_completed) {
    if (!profile?.nickname) {
      return <Navigate to="/onboarding/nickname" replace />
    }
    return <Navigate to="/onboarding/notification" replace />
  }

  return <Outlet />
}
