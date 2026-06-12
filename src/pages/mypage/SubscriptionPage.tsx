import { useEffect, useState } from 'react'
import { NavBar } from '@/components/layout/NavBar'
import { Button, Card } from '@/components/common'
import { PRO_PRICE_LABEL } from '@/constants/billing'
import { getSubscription } from '@/lib/api/subscriptions'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { useSubscription } from '@/hooks/useSubscription'

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
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar title="구독 관리" leftLabel="‹ 뒤로" />

      <div className="flex-1 p-5">
        <Card accent={!isPro} className="mb-4 p-5">
          <p className="text-xs font-semibold text-ink-muted">현재 플랜</p>
          <p className="mt-1 text-2xl font-bold">{isPro ? 'Pro' : 'Free'}</p>
          {isPro && expiresAt && (
            <p className="mt-2 text-xs text-ink-muted">
              다음 갱신: {new Date(expiresAt).toLocaleDateString('ko-KR')}
            </p>
          )}
        </Card>

        {!isPro ? (
          <>
            <p className="mb-3 text-sm font-semibold">Pro 혜택</p>
            <Card className="mb-6 p-4 text-sm">
              <p className="py-1.5">✓ PDF 출판 무제한</p>
              <p className="py-1.5">✓ AI 챕터 무제한</p>
              <p className="py-1.5">✓ 프로젝트 무제한</p>
              <p className="py-1.5">✓ Pro 전용 표지</p>
            </Card>
            <Button onClick={() => showPaywall()}>{PRO_PRICE_LABEL}으로 시작</Button>
          </>
        ) : (
          <Card className="p-4 text-sm text-ink-muted">
            <p>구독 관리는 Google Play 스토어에서 할 수 있어요.</p>
            <p className="mt-2">Play 스토어 → 결제 및 정기 결제 → MyChapter</p>
          </Card>
        )}
      </div>
    </div>
  )
}
