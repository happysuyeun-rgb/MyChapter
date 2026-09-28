import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlatIcon } from '@/components/common'
import { getDevBypassEnv, isDevBypass } from '@/lib/devBypass'
import { useAuthStore } from '@/stores/authStore'

export function SplashPage() {
  const navigate = useNavigate()
  const { session, profile, initialized } = useAuthStore()
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50)
    return () => clearTimeout(timer)
  }, [])


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

      navigate('/home', { replace: true })
    }, 1200)

    return () => clearTimeout(timer)
  }, [initialized, session, profile, navigate])

  return (
    <div className="flex min-h-dvh flex-col bg-ink px-7 py-10 text-surface">
      <div
        className={[
          'flex flex-1 flex-col justify-between transition-opacity duration-500',
          fadeIn ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-surface/20 pb-5">
          <span className="text-[10px] font-semibold tracking-[0.24em] text-surface/50">MY CHAPTER</span>
          <FlatIcon name="book" size={22} className="text-sage" />
        </div>

        <div className="py-12">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-sage">A BOOK OF ME</p>
          <h1 className="mt-5 font-serif text-[42px] font-bold leading-[1.08] tracking-[-0.04em]">
            하루를 기록하고,
            <br />
            삶을 한 권으로.
          </h1>
          <p className="mt-6 max-w-[300px] text-sm leading-7 text-surface/60">
            오늘의 작은 장면들이 모여
            <br />
            언젠가 당신만의 한 권이 됩니다.
          </p>
        </div>

        <div className="border-t border-surface/20 pt-5">
          <div className="flex items-center justify-between text-[10px] tracking-[0.15em] text-surface/40">
            <span>RECORD · EDIT · PUBLISH</span>
            <span>PAGE 01</span>
          </div>
        </div>
      </div>
    </div>
  )
}
