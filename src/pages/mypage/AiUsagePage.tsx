import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ErrorState, LoadingBlock } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { PRO_PRICE_LABEL } from '@/constants/billing'
import { getAiUsageSummary, type AiUsageSummary } from '@/lib/api/aiUsage'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { useSubscription } from '@/hooks/useSubscription'

export function AiUsagePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isPro } = useSubscription()
  const { showPaywall } = usePaywallStore()
  const [summary, setSummary] = useState<AiUsageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const data = await getAiUsageSummary(user.id, isPro ? 'pro' : 'free')
        if (!cancelled) setSummary(data)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user, isPro, retryKey])

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
        <NavBar title="AI 사용량" leftLabel="←" />
        <LoadingBlock label="AI 사용량을 불러오는 중..." />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
        <NavBar title="AI 사용량" leftLabel="←" />
        <ErrorState title="사용량을 불러오지 못했어요" onRetry={() => setRetryKey((k) => k + 1)} />
      </div>
    )
  }

  const remaining =
    summary.monthlyLimit == null
      ? null
      : Math.max(0, summary.monthlyLimit - summary.usedThisMonth)
  const progress =
    summary.monthlyLimit == null
      ? 0
      : Math.min(100, Math.round((summary.usedThisMonth / summary.monthlyLimit) * 100))

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar title="AI 사용량" leftLabel="←" />

      <main className="flex-1 overflow-y-auto px-5 pb-10 pt-6">
        <header className="border-b border-ink pb-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">AI DESK</p>
          <h1 className="mt-2 font-serif text-[26px] font-bold tracking-[-0.03em]">
            이번 달 PAGE가 도와준 양
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            AI 질문·글감 힌트와 AI 편집 사용량을 확인해요. 한도에 닿아도 기록과 직접 편집은 계속할 수 있어요.
          </p>
        </header>

        <section className="mt-8 border-y border-border py-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.14em] text-ink-faint">THIS MONTH</p>
              <p className="mt-2 font-serif text-4xl font-bold text-ink">{summary.usedThisMonth}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {summary.monthlyLimit == null
                  ? 'Pro · 확장 사용'
                  : `Free 한도 ${summary.monthlyLimit}회 중 · 남은 ${remaining}회`}
              </p>
            </div>
            <span className="border border-border px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-ink">
              {isPro ? 'PRO' : 'FREE'}
            </span>
          </div>
          {summary.monthlyLimit != null ? (
            <div className="mt-5 h-px bg-border">
              <div className="h-px bg-sage" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
        </section>

        <section className="mt-8">
          <p className="mb-3 font-serif text-base font-bold">기능별 사용</p>
          <div className="border-t border-border">
            {summary.features.map((feature, index) => (
              <div
                key={feature.key}
                className="flex min-h-[64px] items-center gap-4 border-b border-border py-3"
              >
                <span className="w-7 shrink-0 font-serif text-xs text-ink-faint">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold">{feature.label}</span>
                <span className="font-serif text-xl font-bold">
                  {feature.count}
                  {feature.limit != null && (
                    <span className="ml-1 font-sans text-xs font-normal text-ink-faint">/ {feature.limit}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        {!isPro ? (
          <section className="mt-8 border-l-2 border-terracotta pl-4">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-terracotta">NEED MORE PAGE HELP?</p>
            <p className="mt-2 font-serif text-lg font-bold">Pro에서 AI 도움을 더 넓게</p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              확장 AI 사용과 Pro 표지, 여러 권의 책을 {PRO_PRICE_LABEL}으로 이용할 수 있어요.
            </p>
            <Button className="mt-4" onClick={() => showPaywall()}>
              Pro 알아보기
            </Button>
          </section>
        ) : (
          <section className="mt-8 border-l-2 border-sage pl-4">
            <p className="text-xs font-semibold">Pro 멤버십이 적용 중이에요.</p>
            <p className="mt-1 text-[11px] leading-5 text-ink-muted">
              구독 상태와 갱신일은 구독 관리에서 확인할 수 있어요.
            </p>
            <button
              type="button"
              className="mt-4 min-h-11 text-sm font-semibold text-ink underline-offset-4 active:underline"
              onClick={() => navigate('/mypage/subscription')}
            >
              구독 관리 열기 →
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
