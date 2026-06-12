import { useNavigate } from 'react-router-dom'
import { Badge, Card } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { PRO_PRICE_LABEL } from '@/constants/billing'
import { useSubscription } from '@/hooks/useSubscription'
import { useUserStats } from '@/hooks/useUserStats'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'

export function MyPage() {
  const navigate = useNavigate()
  const { profile, user, signOut } = useAuthStore()
  const { isPro } = useSubscription()
  const { stats, loading } = useUserStats()
  const { showPaywall } = usePaywallStore()

  const menuItems = [
    { icon: '📚', label: '완성한 책 목록', to: '/mypage/completed-books' },
    { icon: '🔔', label: '알림 설정', to: '/mypage/settings' },
    { icon: '💳', label: '구독 관리', to: '/mypage/subscription' },
    { icon: '🔒', label: '개인정보 처리방침', to: '/mypage/privacy-policy' },
  ]

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <NavBar
        title="마이페이지"
        rightLabel="⚙"
        onRightClick={() => navigate('/mypage/settings')}
      />

      <div className="flex items-center gap-4 border-b border-border px-5 py-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-light text-[28px]">
          {profile?.profile_emoji ?? '🌿'}
        </div>
        <div className="flex-1">
          <p className="text-[17px] font-bold">{profile?.nickname ?? '회원'}</p>
          <p className="text-sm text-ink-muted">{user?.email}</p>
        </div>
        <Badge variant={isPro ? 'orange' : 'gray'}>{isPro ? 'Pro' : 'Free'}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        {[
          { label: '기록', value: loading ? '-' : stats.recordCount },
          { label: '챕터', value: loading ? '-' : stats.chapterCount },
          { label: '완성 책', value: loading ? '-' : stats.bookCount },
        ].map((item) => (
          <Card key={item.label} className="p-3 text-center">
            <p className="text-lg font-bold">{item.value}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{item.label}</p>
          </Card>
        ))}
      </div>

      {!loading && stats.streak > 0 && (
        <p className="px-5 pb-2 text-center text-xs text-ink-muted">
          🔥 {stats.streak}일 연속 기록 중
        </p>
      )}

      {!isPro && (
        <Card accent className="mx-5 mt-2 p-4">
          <p className="mb-1.5 text-[13px] font-bold text-accent">✨ Pro로 업그레이드</p>
          <p className="mb-3 text-sm text-ink-muted">
            PDF 출판 무제한 · AI 챕터 구성 · 프로젝트 무제한
          </p>
          <button
            type="button"
            className="w-full rounded-[10px] bg-accent py-2.5 text-[13px] font-bold text-white"
            onClick={() => showPaywall()}
          >
            {PRO_PRICE_LABEL}으로 시작
          </button>
        </Card>
      )}

      {menuItems.map((item) => (
        <button
          key={item.label}
          type="button"
          className="flex w-full items-center gap-3 border-b border-border px-5 py-3.5 text-left"
          onClick={() => navigate(item.to)}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="flex-1 text-sm font-medium">{item.label}</span>
          <span className="text-xs text-ink-faint">›</span>
        </button>
      ))}

      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
        onClick={() => void signOut()}
      >
        <span className="text-lg">🚪</span>
        <span className="text-sm font-medium text-danger">로그아웃</span>
      </button>
    </div>
  )
}
