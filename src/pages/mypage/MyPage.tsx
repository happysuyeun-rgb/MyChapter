import { useNavigate } from 'react-router-dom'
import { Badge, FlatIcon } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { PRO_PRICE_LABEL } from '@/constants/billing'
import { useSubscription } from '@/hooks/useSubscription'
import { useUserStats } from '@/hooks/useUserStats'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'

const menuItems = [
  { index: '01', label: '완성한 책', description: '발행한 책과 PDF를 다시 열어봐요', to: '/mypage/completed-books' },
  { index: '02', label: '알림과 기록 설정', description: '기록 리마인드와 계정 설정을 관리해요', to: '/mypage/settings' },
  { index: '03', label: '구독 관리', description: 'Free / Pro 플랜을 확인해요', to: '/mypage/subscription' },
  { index: '04', label: '개인정보 처리방침', description: '기록과 개인정보 처리 기준을 확인해요', to: '/mypage/privacy-policy' },
]

export function MyPage() {
  const navigate = useNavigate()
  const { profile, user, signOut } = useAuthStore()
  const { isPro } = useSubscription()
  const { stats, loading } = useUserStats()
  const { showPaywall } = usePaywallStore()

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-surface">
      <NavBar title="마이" rightLabel="설정" onRightClick={() => navigate('/mypage/settings')} />

      <header className="px-5 pb-6 pt-7">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-sage">AUTHOR PROFILE</p>
        <div className="mt-3 flex items-end justify-between gap-4 border-b border-ink pb-6">
          <div className="min-w-0">
            <h1 className="truncate font-serif text-[28px] font-bold tracking-[-0.03em]">
              {profile?.nickname ?? '회원'}의 서재
            </h1>
            <p className="mt-2 truncate text-xs text-ink-muted">{user?.email}</p>
          </div>
          <Badge variant={isPro ? 'orange' : 'gray'}>{isPro ? 'PRO' : 'FREE'}</Badge>
        </div>
      </header>

      <main className="px-5 pb-10">
        <section>
          <p className="mb-3 font-serif text-base font-bold">나의 기록</p>
          <div className="grid grid-cols-3 border-y border-border">
            {[
              { label: '기록', value: loading ? '—' : stats.recordCount },
              { label: '챕터', value: loading ? '—' : stats.chapterCount },
              { label: '완성 책', value: loading ? '—' : stats.bookCount },
            ].map((item, index) => (
              <div key={item.label} className={['py-5 text-center', index > 0 ? 'border-l border-border' : ''].join(' ')}>
                <p className="font-serif text-2xl font-bold">{item.value}</p>
                <p className="mt-1 text-[11px] text-ink-muted">{item.label}</p>
              </div>
            ))}
          </div>
          {!loading && stats.streak > 0 && (
            <p className="mt-3 text-xs text-ink-muted">최근 {stats.streak}일 동안 기록을 이어가고 있어요.</p>
          )}
        </section>

        {!isPro && (
          <section className="mt-8 border-l-2 border-terracotta pl-4">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-terracotta">MY CHAPTER PRO</p>
            <p className="mt-2 font-serif text-lg font-bold">첫 책 다음의 이야기도 계속</p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              여러 권의 책, 재발행, 확장 AI 기능과 Pro 표지를 이용할 수 있어요.
            </p>
            <button
              type="button"
              className="mt-4 min-h-11 border-b border-ink pb-1 text-sm font-semibold text-ink"
              onClick={() => showPaywall()}
            >
              {PRO_PRICE_LABEL}으로 Pro 보기 →
            </button>
          </section>
        )}

        <section className="mt-9">
          <p className="mb-3 font-serif text-base font-bold">서재 관리</p>
          <div className="border-t border-border">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className="group flex min-h-[76px] w-full items-center gap-4 border-b border-border py-4 text-left active:bg-accent-light/40"
                onClick={() => navigate(item.to)}
              >
                <span className="w-7 shrink-0 font-serif text-xs text-ink-faint">{item.index}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-[11px] leading-5 text-ink-muted">{item.description}</span>
                </span>
                <span className="text-lg text-ink-faint transition-transform group-active:translate-x-1">→</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 border-t border-border pt-5">
          <div className="flex items-center gap-3">
            <FlatIcon name="book" size={20} className="text-sage" />
            <p className="text-xs leading-5 text-ink-muted">
              MY CHAPTER는 당신의 원본 기록을 보존하고, 그 위에 책의 구조를 만들어갑니다.
            </p>
          </div>
          <button
            type="button"
            className="mt-6 min-h-11 text-sm text-danger"
            onClick={() => void signOut()}
          >
            로그아웃
          </button>
        </section>
      </main>
    </div>
  )
}
