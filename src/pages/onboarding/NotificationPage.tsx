import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, FlatIcon } from '@/components/common'
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
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar leftLabel="← 이전" />
      <main className="flex flex-1 flex-col px-5 pb-8 pt-7">
        <section className="border-y border-ink py-7">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">AUTHOR SETUP · 02 / 02</p>
            <FlatIcon name="pen" size={24} className="text-sage" />
          </div>
          <h1 className="mt-5 font-serif text-[28px] font-bold leading-snug tracking-[-0.03em]">
            기록할 시간을
            <br />
            가볍게 알려드릴까요?
          </h1>
          <p className="mt-4 text-sm leading-6 text-ink-muted">
            알림은 기록을 강요하지 않아요. 오늘의 페이지를 잊지 않도록 조용히 알려드릴게요.
          </p>
        </section>

        <div className="mt-7 border-l-2 border-sage pl-4">
          <p className="text-xs font-semibold">알림은 언제든 설정에서 바꿀 수 있어요.</p>
          <p className="mt-1 text-[11px] leading-5 text-ink-muted">건너뛰어도 책 만들기와 기록 기능에는 제한이 없습니다.</p>
        </div>

        <div className="mt-auto pt-8">
          <Button disabled={loading} onClick={() => void complete(true)}>알림 받기</Button>
          <Button variant="ghost" className="mt-2" disabled={loading} onClick={() => void complete(false)}>
            지금은 받지 않을게요
          </Button>
        </div>
      </main>
    </div>
  )
}
