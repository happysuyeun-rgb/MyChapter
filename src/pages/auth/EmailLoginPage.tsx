import { useState } from 'react'
import { Button, FlatIcon, Input } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { supabase } from '@/lib/supabase'

export function EmailLoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: submitError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/splash`,
      },
    })
    setLoading(false)
    if (submitError) {
      setError('로그인 링크를 보내지 못했어요. 다시 시도해주세요.')
      return
    }
    setSent(true)
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar title="이메일로 시작하기" leftLabel="←" />
      <main className="flex flex-1 flex-col px-5 pb-8 pt-8">
        {sent ? (
          <div className="flex flex-1 flex-col justify-center">
            <div className="border-y border-ink py-8">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">CHECK YOUR MAIL</p>
                <FlatIcon name="book" size={26} className="text-sage" />
              </div>
              <h1 className="mt-5 font-serif text-[26px] font-bold leading-snug">로그인 링크를 보냈어요.</h1>
              <p className="mt-4 text-sm leading-6 text-ink-muted">
                <strong className="text-ink">{email}</strong>
                <br />
                메일 안의 링크를 누르면 MY CHAPTER로 돌아옵니다.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-ink pb-6">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">EMAIL SIGN IN</p>
              <h1 className="mt-3 font-serif text-[27px] font-bold leading-snug">이메일로 한 페이지를 열어볼까요?</h1>
              <p className="mt-3 text-sm leading-6 text-ink-muted">비밀번호 없이 로그인 링크를 보내드려요.</p>
            </div>

            <div className="mt-8">
              <label className="mb-2 block text-[10px] font-semibold tracking-[0.16em] text-ink-faint">EMAIL ADDRESS</label>
              <Input
                active
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            </div>

            <div className="mt-auto pt-8">
              <Button disabled={loading || !email.trim()} onClick={() => void handleSubmit()}>
                {loading ? '발송 중...' : '로그인 링크 보내기'}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
