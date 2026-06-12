import { useState } from 'react'
import { Button, Input } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { supabase } from '@/lib/supabase'

export function EmailLoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim()) return
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
      },
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar title="이메일로 시작하기" leftLabel="←" />
      <div className="flex flex-1 flex-col p-5">
        {sent ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 text-4xl">✉️</div>
            <h2 className="mb-2 text-lg font-bold">메일을 확인해주세요</h2>
            <p className="text-sm leading-relaxed text-ink-muted">
              <strong className="text-ink">{email}</strong>
              <br />
              으로 로그인 링크를 보냈어요
            </p>
          </div>
        ) : (
          <>
            <label className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
              이메일 주소
            </label>
            <Input
              active
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="mt-auto pt-6">
              <Button disabled={loading || !email.trim()} onClick={() => void handleSubmit()}>
                {loading ? '발송 중...' : '로그인 링크 보내기'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
