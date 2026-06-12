import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, ProgressBar } from '@/components/common'
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
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <div className="flex flex-1 flex-col p-5 pt-8">
        <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
          1 / 2 단계
        </p>
        <ProgressBar value={50} className="mb-7" />
        <h1 className="mb-2 text-lg font-bold">어떻게 불러드릴까요?</h1>
        <p className="mb-7 text-sm text-ink-muted">책 안에서 당신을 부를 이름이에요</p>
        <Input
          active
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          maxLength={10}
        />
        <p className="mt-2 pl-1 text-[11px] text-ink-faint">
          2~10자, 한글·영문·숫자 사용 가능
        </p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
      <div className="p-5">
        <Button disabled={!isValid || loading} onClick={() => void handleNext()}>
          다음
        </Button>
      </div>
    </div>
  )
}
