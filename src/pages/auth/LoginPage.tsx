import { Capacitor } from '@capacitor/core'
import { Link } from 'react-router-dom'
import type { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

function getOAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return 'com.mychapter.app://home'
  }
  return `${window.location.origin}/home`
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
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col justify-center bg-white px-7 py-10">
      <div className="text-center">
        <div className="mb-4 text-[32px]">📖</div>
        <h1 className="mb-2 text-lg font-bold leading-snug">
          MyChapter에 오신 걸
          <br />
          환영합니다
        </h1>
        <p className="mb-10 text-sm text-ink-muted">당신의 이야기를 한 권의 책으로</p>
      </div>

      <button
        type="button"
        onClick={() => void signInWithOAuth('kakao')}
        className="mb-3 w-full rounded-btn bg-[#FEE500] py-[15px] text-[15px] font-bold text-[#191600]"
      >
        카카오로 시작하기
      </button>
      <button
        type="button"
        onClick={() => void signInWithOAuth('google')}
        className="mb-3 w-full rounded-btn border-[1.5px] border-border-strong bg-white py-3.5 text-[15px] font-medium"
      >
        Google로 시작하기
      </button>
      <Link
        to="/login/email"
        className="block py-3 text-center text-sm text-ink-muted"
      >
        이메일로 시작하기
      </Link>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-faint">
        시작하면{' '}
        <Link to="/mypage/terms-of-service" className="underline">
          이용약관
        </Link>
        {' '}및{' '}
        <Link to="/mypage/privacy-policy" className="underline">
          개인정보처리방침
        </Link>
        에 동의합니다
      </p>
    </div>
  )
}
