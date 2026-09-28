import { useState } from 'react'
import { Button, FlatIcon } from '@/components/common'
import { PRO_PRICE_LABEL } from '@/constants/billing'
import { BillingError, isBillingAvailable, purchasePro } from '@/lib/billing'
import { verifyPurchase } from '@/lib/api/subscriptions'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

const features = [
  { index: '01', icon: 'projects' as const, label: '여러 권의 책 만들기' },
  { index: '02', icon: 'pdf' as const, label: '책 재발행과 추가 발행' },
  { index: '03', icon: 'chapters' as const, label: '확장 AI 기능과 Pro 표지' },
]

export function PaywallModal() {
  const { user } = useAuthStore()
  const { isOpen, closePaywall, completePurchase } = usePaywallStore()
  const { setPlan } = useSubscriptionStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handlePurchase = async () => {
    if (!user) return

    if (!isBillingAvailable()) {
      setError('모바일 앱에서 결제해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const purchase = await purchasePro()
      const plan = await verifyPurchase(purchase.purchaseToken, purchase.productId, purchase.orderId)
      setPlan(plan)
      completePurchase()
    } catch (err) {
      if (err instanceof BillingError) setError(err.message)
      else if (err instanceof Error) setError(err.message)
      else setError('결제에 실패했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button type="button" className="absolute inset-0 bg-ink/55" aria-label="닫기" onClick={closePaywall} />
      <div className="relative z-10 w-full max-w-phone border-t border-ink bg-surface px-6 pb-6 pt-7 shadow-[0_-12px_40px_rgba(0,0,0,0.12)]">
        <header className="border-b border-ink pb-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">MY CHAPTER PRO</p>
            <FlatIcon name="sparkle" size={24} className="text-sage" />
          </div>
          <h2 className="mt-4 font-serif text-[26px] font-bold leading-snug tracking-[-0.03em]">첫 책 다음의 이야기도 계속.</h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">두 번째 책과 재발행, 확장 AI 기능이 필요할 때 Pro를 시작하세요.</p>
        </header>

        <div className="border-b border-border">
          {features.map((feature) => (
            <div key={feature.label} className="flex min-h-[58px] items-center gap-4 border-b border-border py-3 last:border-b-0">
              <span className="w-7 font-serif text-xs text-ink-faint">{feature.index}</span>
              <FlatIcon name={feature.icon} size={18} className="text-sage" />
              <span className="flex-1 text-sm font-semibold">{feature.label}</span>
              <FlatIcon name="check" size={16} className="text-ink" />
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[9px] tracking-[0.14em] text-ink-faint">MONTHLY</p>
            <p className="mt-1 font-serif text-2xl font-bold">{PRO_PRICE_LABEL}</p>
          </div>
          <p className="text-[10px] text-ink-faint">첫 책은 Free로 완성 가능</p>
        </div>

        {error && <p className="mt-4 text-center text-sm text-danger">{error}</p>}

        <Button className="mt-6" disabled={loading} onClick={() => void handlePurchase()}>
          {loading ? '결제 처리 중...' : 'Pro 시작하기'}
        </Button>
        <Button variant="ghost" className="mt-2" onClick={closePaywall}>나중에 하기</Button>
      </div>
    </div>
  )
}
