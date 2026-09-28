import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, ProgressBar } from '@/components/common'
import { ChapterLimitBanner } from '@/components/features/chapter/ChapterLimitBanner'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { useChapterLimitStatus } from '@/hooks/useChapterLimitStatus'
import { useSubscription } from '@/hooks/useSubscription'
import { getUnreadCount } from '@/lib/api/notifications'
import { getProjects } from '@/lib/api/projects'
import { listRecords } from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@/types/database'
import { getBookReadiness } from '@/utils/bookReadiness'

export function HomePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { setActiveProject } = useProjectStore()
  const { isPro } = useSubscription()
  const { showPaywall } = usePaywallStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [recordCount, setRecordCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { chapterLimitReached } = useChapterLimitStatus(projects[0]?.id)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const projectData = await getProjects(user.id)
      setProjects(projectData)
      if (projectData[0]) {
        setActiveProject(projectData[0])
        const records = await listRecords(user.id, { projectId: projectData[0].id })
        setRecordCount(records.length)
      }
      setUnreadCount(await getUnreadCount(user.id))
      setLoading(false)
    }
    void load()
  }, [user, setActiveProject])

  if (loading) return <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">로딩 중...</div>
  if (projects.length === 0) return <EmptyState variant="home" />

  const project = projects[0]
  const typeLabel = PROJECT_TYPES.find((p) => p.type === project.type)?.label ?? '나의 이야기'
  const readiness = getBookReadiness(project, recordCount)
  const progress = readiness.score
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
  const steps = ['기록', '챕터', '원고', '표지', '발행']
  const activeStep = readiness.isReady ? 1 : 0

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-surface">
      <header className="flex items-center justify-between px-5 pb-3 pt-6">
        <div>
          <p className="text-xs text-ink-faint">{today}</p>
          <h1 className="mt-1 font-serif text-xl font-bold">안녕하세요, {profile?.nickname ?? '회원'}님</h1>
          <p className="mt-1 text-xs text-ink-muted">오늘의 한 페이지를 남겨볼까요?</p>
        </div>
        <button type="button" aria-label="알림" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-card" onClick={() => navigate('/notifications')}>
          <span className="text-lg">♢</span>
          {unreadCount > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-terracotta ring-2 ring-surface" />}
        </button>
      </header>

      {!isPro && chapterLimitReached && <div className="px-5 pt-3"><ChapterLimitBanner onUpgrade={() => showPaywall()} /></div>}

      <main className="px-5 pb-6 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-serif text-base font-bold">지금 쓰고 있는 책</h2>
          <button className="text-xs font-semibold text-sage" onClick={() => navigate('/library')}>내 서재 →</button>
        </div>

        <section className="border-y border-border py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-28 w-20 shrink-0 flex-col justify-between rounded-r-md rounded-l-sm bg-accent p-3 text-surface shadow-paper">
              <span className="text-[9px] uppercase tracking-[0.2em] opacity-70">MY CHAPTER</span>
              <span className="font-serif text-sm font-bold leading-snug">{project.title}</span>
              <span className="text-[9px] opacity-70">{typeLabel}</span>
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-xs text-sage">{typeLabel}</p>
              <h2 className="mt-1 truncate font-serif text-lg font-bold">{project.title}</h2>
              <div className="mt-5 flex items-end justify-between">
                <span className="text-xs text-ink-muted">이야기 준비도</span>
                <span className="font-serif text-2xl font-bold">{recordCount === 0 ? '첫 페이지' : `${progress}%`}</span>
              </div>
              {recordCount > 0 && <ProgressBar value={progress} className="mt-2" />}
              <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">{recordCount === 0 ? '첫 기록을 남기면 나의 책이 시작됩니다.' : readiness.message}</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            {steps.map((step, index) => (
              <div key={step} className="flex flex-col items-center gap-1">
                <span className={['h-2 w-2 rounded-full', index <= activeStep ? 'bg-sage' : 'bg-surface-alt'].join(' ')} />
                <span className={['text-[10px]', index <= activeStep ? 'font-semibold text-ink' : 'text-ink-faint'].join(' ')}>{step}</span>
              </div>
            ))}
          </div>
        </section>

        <button type="button" className="mt-5 w-full rounded-btn bg-accent px-5 py-4 text-center text-[15px] font-semibold text-white shadow-paper" onClick={() => navigate('/record/mode')}>
          오늘 기록하기
          <span className="mt-1 block text-[11px] font-normal text-white/70">AI 질문으로 또는 자유롭게 기록해보세요</span>
        </button>

        <section className="mt-8 border-t border-border pt-5">
          <div className="flex gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[#D8CCB9] bg-[#FFF9EE] shadow-sm">
                <span className="absolute -top-1 left-5 h-2 w-1 rotate-[-28deg] rounded-full bg-sage" />
                <span className="absolute -top-1 right-3 h-1.5 w-2 rotate-[25deg] rounded-full bg-sage" />
                <span className="font-serif text-[10px] font-bold tracking-[0.12em] text-ink">PAGE</span>
              </div>
              <div>
                <p className="text-sm font-semibold">PAGE가 기다리고 있어요.</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{readiness.isReady ? '이야기가 충분히 모였어요. 내 서재에서 책 만들기를 시작할 수 있어요.' : `완벽하게 쓰지 않아도 괜찮아요. 기록 ${readiness.recordsRemaining > 0 ? `${readiness.recordsRemaining}개` : '조건 충족'}${readiness.daysRemaining > 0 ? ` · ${readiness.daysRemaining}일` : ''}이 더 쌓이면 책 만들기가 열려요.`}</p>
              </div>
          </div>
        </section>

        {projects.length > 1 && (
          <button className="mt-4 w-full text-center text-xs text-ink-muted" onClick={() => navigate('/library')}>
            다른 책 {projects.length - 1}권 보기
          </button>
        )}
      </main>
    </div>
  )
}
