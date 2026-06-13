import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDevBypassEnv, isDevBypass } from '@/lib/devBypass'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

export function SplashPage() {
  const navigate = useNavigate()
  const { initialize, session, profile, initialized } = useAuthStore()
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (!initialized) return

    const bypassActive = isDevBypass()
    const bypassEnv = getDevBypassEnv()

    if (import.meta.env.DEV || bypassEnv !== undefined) {
      console.info(
        '[MyChapter dev-bypass]',
        'import.meta.env.VITE_DEV_BYPASS =',
        import.meta.env.VITE_DEV_BYPASS,
        '| parsed =',
        bypassEnv,
        '| active =',
        bypassActive,
      )
    }

    if (bypassActive) {
      navigate('/home', { replace: true })
      return
    }

    const timer = setTimeout(async () => {
      if (!session) {
        navigate('/login', { replace: true })
        return
      }

      if (!profile?.nickname) {
        navigate('/onboarding/nickname', { replace: true })
        return
      }

      if (!profile.onboarding_completed) {
        navigate('/onboarding/notification', { replace: true })
        return
      }

      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)

      navigate(count && count > 0 ? '/home' : '/home', { replace: true })
    }, 1500)

    return () => clearTimeout(timer)
  }, [initialized, session, profile, navigate])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-7 text-center text-white">
      <div
        className={[
          'transition-opacity duration-300',
          fadeIn ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <div className="mb-2 text-[52px]">📖</div>
        <h1 className="mb-4 text-[40px] font-extrabold tracking-tight">
          My<span className="text-accent-mid">Chapter</span>
        </h1>
        <p className="text-base leading-relaxed text-white/60">
          오늘 한 줄이
          <br />
          언젠가 당신의 한 챕터가 됩니다
        </p>
        <div className="mx-auto mt-10 h-1 w-10 rounded-sm bg-accent-mid" />
      </div>
    </div>
  )
}
