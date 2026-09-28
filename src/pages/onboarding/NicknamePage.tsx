import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/common'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function NicknamePage() {
  const navigate = useNavigate()
  const { user, setProfile } = useAuthStore()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = /^[a-zA-Z0-9가-힣]{2,10}$/.test(nickname)

  const handleNext = async () => {
    if (!isValid || !user) return
    setLoading(true)
    setError('')

    const { data, error: updateError } = await supabase
      .from('users')
      .update({ nickname })
      .eq('id', user.id)
      .select()
      .single()

    setLoading(false)

    if (updateError) {
      setError('닉네임 저장에 실패했어요. 다시 시도해주세요.')
      return
    }

    setProfile(data)
    navigate('/onboarding/notification')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface px-5 pb-8 pt-7">
      <header className="border-b border-ink pb-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">AUTHOR SETUP · 01 / 02</p>
          <span className="font-serif text-xs text-ink-faint">01</span>
        </div>
        <h1 className="mt-5 font-serif text-[29px] font-bold leading-snug tracking-[-0.03em]">책 안에서 당신을 뭐라고 부를까요?</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">PAGE가 기록과 책을 안내할 때 사용할 이름이에요.</p>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="mt-9">
          <label className="mb-2 block text-[10px] font-semibold tracking-[0.16em] text-ink-faint">AUTHOR NAME</label>
          <Input
            active
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            maxLength={10}
          />
          <p className="mt-3 text-[11px] leading-5 text-ink-faint">2~10자 · 한글, 영문, 숫자를 사용할 수 있어요.</p>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </div>

        <div className="mt-auto pt-8">
          <Button disabled={!isValid || loading} onClick={() => void handleNext()}>
            {loading ? '저장 중...' : '다음 페이지'}
          </Button>
        </div>
      </main>
    </div>
  )
}
