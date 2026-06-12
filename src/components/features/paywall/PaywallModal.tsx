import { useState } from 'react'
import { Button } from '@/components/common'
import { PRO_PRICE_LABEL } from '@/constants/billing'
import { BillingError, isBillingAvailable, purchasePro } from '@/lib/billing'
import { verifyPurchase } from '@/lib/api/subscriptions'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

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
      const plan = await verifyPurchase(
        purchase.purchaseToken,
        purchase.productId,
        purchase.orderId,
      )
      setPlan(plan)
      completePurchase()
    } catch (err) {
      if (err instanceof BillingError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('결제에 실패했어요. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="닫기"
        onClick={closePaywall}
      />
      <div className="relative z-10 w-full max-w-phone rounded-t-3xl bg-white px-6 pb-6 pt-7">
        <div className="mx-auto mb-5 h-1 w-9 rounded-sm bg-border-strong" />
        <div className="mb-5 text-center">
          <div className="mb-2.5 text-3xl">✨</div>
          <h2 className="mb-1.5 text-lg font-bold">Pro로 업그레이드</h2>
          <p className="text-sm text-ink-muted">첫 책을 PDF로 받아보세요</p>
        </div>
        <div className="mb-4 rounded-card border-[1.5px] border-accent bg-accent-light p-4 text-sm">
          <div className="flex justify-between py-1">
            <span>PDF 출판 무제한</span>
            <span className="text-accent">✓</span>
          </div>
          <div className="flex justify-between py-1">
            <span>AI 챕터 구성</span>
            <span className="text-accent">✓</span>
          </div>
          <div className="flex justify-between py-1">
            <span>프로젝트 무제한</span>
            <span className="text-accent">✓</span>
          </div>
        </div>
        {error && (
          <p className="mb-3 text-center text-sm text-danger">{error}</p>
        )}
        <Button disabled={loading} onClick={() => void handlePurchase()}>
          {loading ? '결제 처리 중...' : `${PRO_PRICE_LABEL} 시작`}
        </Button>
        <Button variant="ghost" className="mt-2" onClick={closePaywall}>
          나중에 하기
        </Button>
      </div>
    </div>
  )
}
