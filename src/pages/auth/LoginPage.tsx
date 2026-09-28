import { Capacitor } from '@capacitor/core'
import { Link } from 'react-router-dom'
import type { Provider } from '@supabase/supabase-js'
import { FlatIcon } from '@/components/common'
import { supabase } from '@/lib/supabase'

function getOAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return 'com.mychapter.app://home'
  }
  return `${window.location.origin}/splash`
}

async function signInWithOAuth(provider: Provider) {
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getOAuthRedirectUrl(),
    },
  })
}

export function LoginPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface px-6 py-8">
      <header className="flex items-center justify-between border-b border-ink pb-5">
        <p className="text-[10px] font-semibold tracking-[0.22em] text-sage">MY CHAPTER</p>
        <FlatIcon name="book" size={22} className="text-sage" />
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-ink-faint">WELCOME, AUTHOR</p>
        <h1 className="mt-4 font-serif text-[31px] font-bold leading-[1.3] tracking-[-0.035em]">
          당신의 이야기를
          <br />
          한 권으로 시작해보세요.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          기록은 가볍게, 책 만들기는 천천히.
          <br />
          MY CHAPTER가 작은 편집자가 되어 함께할게요.
        </p>

        <div className="mt-10 border-t border-border pt-5">
          <button
            type="button"
            onClick={() => void signInWithOAuth('kakao')}
            className="flex min-h-[50px] w-full items-center justify-between border-b border-border text-left text-sm font-semibold"
          >
            <span>카카오로 시작하기</span><span>→</span>
          </button>
          <button
            type="button"
            onClick={() => void signInWithOAuth('google')}
            className="flex min-h-[50px] w-full items-center justify-between border-b border-border text-left text-sm font-semibold"
          >
            <span>Google로 시작하기</span><span>→</span>
          </button>
          <Link
            to="/login/email"
            className="flex min-h-[50px] items-center justify-between border-b border-border text-sm font-semibold"
          >
            <span>이메일로 시작하기</span><span>→</span>
          </Link>
        </div>
      </main>

      <p className="border-t border-border pt-5 text-[10px] leading-5 text-ink-faint">
        시작하면 <Link to="/mypage/terms-of-service" className="underline">이용약관</Link> 및{' '}
        <Link to="/mypage/privacy-policy" className="underline">개인정보처리방침</Link>에 동의합니다.
      </p>
    </div>
  )
}
