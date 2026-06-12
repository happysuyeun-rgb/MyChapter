import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ProgressBar } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function NotificationPage() {
  const navigate = useNavigate()
  const { user, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const complete = async (enabled: boolean) => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('users')
      .update({
        notification_enabled: enabled,
        onboarding_completed: true,
      })
      .eq('id', user.id)
      .select()
      .single()

    setLoading(false)

    if (!error && data) {
      setProfile(data)
    }

    navigate('/project/new')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar leftLabel="← 이전" />
      <div className="flex flex-1 flex-col p-5 pt-8">
        <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
          2 / 2 단계
        </p>
        <ProgressBar value={100} className="mb-7" />
        <div className="py-5 text-center">
          <div className="mb-4 text-[56px]">🔔</div>
          <h1 className="mb-2.5 text-lg font-bold leading-snug">
            기록 알림을
            <br />
            보내드려도 될까요?
          </h1>
          <p className="text-sm leading-relaxed text-ink-muted">
            매일 기록 시간에 AI 질문을 보내드릴게요.
            <br />
            알림 덕분에 완주율이 3배 높아져요.
          </p>
        </div>
      </div>
      <div className="p-5">
        <Button disabled={loading} onClick={() => void complete(true)}>
          알림 허용하기
        </Button>
        <Button
          variant="ghost"
          className="mt-2"
          disabled={loading}
          onClick={() => void complete(false)}
        >
          나중에 설정할게요
        </Button>
      </div>
    </div>
  )
}
