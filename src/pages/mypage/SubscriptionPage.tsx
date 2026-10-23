import { useEffect, useState } from 'react'
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/common'
import { PRO_PRICE_LABEL } from '@/constants/billing'
import { getSubscription } from '@/lib/api/subscriptions'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { useSubscription } from '@/hooks/useSubscription'
import { useToastStore } from '@/stores/toastStore'

const FEATURES = [
  { index: '01', label: '책 만들기', free: '첫 번째 책', pro: '여러 권' },
  { index: '02', label: '재발행·추가 발행', free: '-', pro: '가능' },
  { index: '03', label: 'AI 기능', free: '기본', pro: '확장' },
  { index: '04', label: '표지', free: '기본', pro: 'Pro 전용 포함' },
] as const

export function SubscriptionPage() {
  const { user } = useAuthStore()
  const { isPro } = useSubscription()
  const { showPaywall } = usePaywallStore()
  const { showToast } = useToastStore()
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    void getSubscription(user.id).then((sub) => setExpiresAt(sub.expires_at))
  }, [user])

  const handleRestore = () => {
    showToast('구독 복원은 모바일 앱에서 이용할 수 있어요.')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar title="구독 관리" leftLabel="←" />

      <main className="flex-1 overflow-y-auto px-5 pb-10 pt-6">
        <header className="border-b border-ink pb-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">MEMBERSHIP</p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-ink-muted">현재 플랜</p>
              <h1 className="mt-1 font-serif text-[32px] font-bold tracking-[-0.03em]">{isPro ? 'Pro' : 'Free'}</h1>
            </div>
            {!isPro && <span className="font-serif text-lg font-bold text-terracotta">{PRO_PRICE_LABEL}</span>}
          </div>
          {isPro && expiresAt && (
            <p className="mt-3 text-xs text-ink-muted">다음 갱신: {new Date(expiresAt).toLocaleDateString('ko-KR')}</p>
          )}
        </header>

        {!isPro ? (
          <>
            <section className="mt-8">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-sage">PRO INCLUDES</p>
              <div className="mt-3 border-t border-border">
                <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-b border-border py-2 pl-11 text-[10px] font-semibold tracking-[0.12em] text-ink-faint">
                  <span>FEATURE</span>
                  <span className="text-center">FREE</span>
                  <span className="text-center text-terracotta">PRO</span>
                </div>
                {FEATURES.map((row) => (
                  <div key={row.label} className="flex min-h-[58px] items-center gap-4 border-b border-border py-3">
                    <span className="w-7 shrink-0 font-serif text-xs text-ink-faint">{row.index}</span>
                    <div className="grid flex-1 grid-cols-[1.4fr_1fr_1fr] items-center gap-2 text-sm">
                      <span className="font-semibold">{row.label}</span>
                      <span className="text-center text-xs text-ink-muted">{row.free}</span>
                      <span className="text-center text-xs font-semibold text-terracotta">{row.pro}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8 border-l-2 border-sage pl-4">
              <p className="text-xs font-semibold">첫 번째 책은 Free로 완성할 수 있어요.</p>
              <p className="mt-1 text-[11px] leading-5 text-ink-muted">Pro는 두 번째 책, 재발행, 확장 기능이 필요할 때 시작하면 됩니다.</p>
            </section>

            <Button className="mt-8" onClick={() => showPaywall()}>{PRO_PRICE_LABEL}으로 Pro 시작</Button>
            <Button variant="ghost" className="mt-2" onClick={handleRestore}>
              구매 복원하기
            </Button>
          </>
        ) : (
          <section className="mt-8 border-y border-border py-5">
            <p className="font-serif text-base font-bold">Pro 구독을 이용 중이에요.</p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              결제와 해지는 Google Play 스토어의 결제 및 정기 결제 메뉴에서 관리할 수 있어요.
            </p>
            <Button variant="secondary" className="mt-4" onClick={handleRestore}>
              구매 복원하기
            </Button>
          </section>
        )}
      </main>
    </div>
  )
}
