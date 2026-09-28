import { useEffect, useState } from 'react'
import { NavBar } from '@/components/layout/NavBar'
import { Button } from '@/components/common'
import { PRO_PRICE_LABEL } from '@/constants/billing'
import { getSubscription } from '@/lib/api/subscriptions'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { useSubscription } from '@/hooks/useSubscription'

const BENEFITS = [
  ['01', '여러 권의 책 만들기'],
  ['02', '재발행과 추가 발행'],
  ['03', '확장 AI 기능'],
  ['04', 'Pro 전용 표지'],
] as const

export function SubscriptionPage() {
  const { user } = useAuthStore()
  const { isPro } = useSubscription()
  const { showPaywall } = usePaywallStore()
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    void getSubscription(user.id).then((sub) => setExpiresAt(sub.expires_at))
  }, [user])

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
                {BENEFITS.map(([index, label]) => (
                  <div key={label} className="flex min-h-[58px] items-center gap-4 border-b border-border py-3">
                    <span className="w-7 font-serif text-xs text-ink-faint">{index}</span>
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8 border-l-2 border-sage pl-4">
              <p className="text-xs font-semibold">첫 번째 책은 Free로 완성할 수 있어요.</p>
              <p className="mt-1 text-[11px] leading-5 text-ink-muted">Pro는 두 번째 책, 재발행, 확장 기능이 필요할 때 시작하면 됩니다.</p>
            </section>

            <Button className="mt-8" onClick={() => showPaywall()}>{PRO_PRICE_LABEL}으로 Pro 시작</Button>
          </>
        ) : (
          <section className="mt-8 border-y border-border py-5">
            <p className="font-serif text-base font-bold">Pro 구독을 이용 중이에요.</p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              결제와 해지는 Google Play 스토어의 결제 및 정기 결제 메뉴에서 관리할 수 있어요.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
