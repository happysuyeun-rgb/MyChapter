import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, ErrorState, FlatIcon, LoadingBlock, ProgressBar } from '@/components/common'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { getUnreadCount } from '@/lib/api/notifications'
import { getPublishedBook, type PublishedBook } from '@/lib/api/books'
import { isDevBypass } from '@/lib/devBypass'
import { getProjects } from '@/lib/api/projects'
import { listRecords } from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@/types/database'
import { getBookReadiness } from '@/utils/bookReadiness'

export function HomePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { activeProjectId, setActiveProject } = useProjectStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [recordCount, setRecordCount] = useState(0)
  const [latestPublication, setLatestPublication] = useState<PublishedBook | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError(false)
      try {
        const projectData = await getProjects(user.id)
        if (cancelled) return
        setProjects(projectData)
        const selected = projectData.find((project) => project.id === activeProjectId) ?? projectData[0]
        if (selected) {
          setActiveProject(selected)
          const [records, publication, unread] = await Promise.all([
            listRecords(user.id, { projectId: selected.id }),
            isDevBypass() ? Promise.resolve(null) : getPublishedBook(selected.id),
            getUnreadCount(user.id),
          ])
          if (cancelled) return
          setRecordCount(records.length)
          setLatestPublication(publication)
          setUnreadCount(unread)
        } else {
          setLatestPublication(null)
          setRecordCount(0)
          setUnreadCount(0)
        }
      } catch {
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [user, activeProjectId, setActiveProject, retryKey])

  if (loading) return <LoadingBlock label="홈을 불러오는 중..." />
  if (loadError) {
    return (
      <ErrorState
        title="홈을 불러오지 못했어요"
        onRetry={() => setRetryKey((k) => k + 1)}
      />
    )
  }
  if (projects.length === 0) return <EmptyState variant="home" />

  const project = projects.find((item) => item.id === activeProjectId) ?? projects[0]
  const typeLabel = PROJECT_TYPES.find((p) => p.type === project.type)?.label ?? '나의 이야기'
  const readiness = getBookReadiness(project, recordCount)
  const isPublished = latestPublication !== null
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-surface">
      <header className="px-5 pb-5 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] tracking-[0.12em] text-ink-faint">{today}</p>
            <h1 className="mt-2 font-serif text-[24px] font-bold tracking-[-0.03em]">
              {profile?.nickname ?? '회원'}님의 오늘 페이지
            </h1>
          </div>
          <button
            type="button"
            aria-label="알림"
            className="relative flex h-11 w-11 items-center justify-center border border-border bg-surface"
            onClick={() => navigate('/notifications')}
          >
            <span className="text-base">◇</span>
            {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-terracotta" />}
          </button>
        </div>
      </header>

      <main className="pb-8">
        <section className="bg-ink px-5 py-7 text-surface">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-surface/55">{isPublished ? 'PUBLISHED BOOK' : 'CURRENT BOOK'}</p>
            <button className="text-xs text-surface/70" onClick={() => navigate('/library')}>내 서재 →</button>
          </div>

          <div className="mt-6 flex gap-5">
            <div className="flex h-36 w-24 shrink-0 flex-col justify-between rounded-r-md rounded-l-[3px] bg-[#F2E6D4] p-3.5 text-ink shadow-[8px_10px_0_rgba(0,0,0,.12)]">
              <span className="text-[7px] tracking-[0.18em] text-ink/45">MY CHAPTER</span>
              <div>
                <span className="mb-3 block h-px w-7 bg-sage" />
                <p className="line-clamp-4 font-serif text-[13px] font-bold leading-[1.45]">{(latestPublication?.title_snapshot ?? project.title)}</p>
              </div>
              <span className="text-[7px] text-ink/45">{typeLabel}</span>
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <p className="text-xs text-surface/55">{typeLabel}</p>
              <h2 className="mt-2 line-clamp-2 font-serif text-xl font-bold leading-snug">{(latestPublication?.title_snapshot ?? project.title)}</h2>
              {isPublished ? <div className="mt-6"><p className="font-serif text-xl font-bold">v{latestPublication.version} · 발행 완료</p><p className="mt-2 text-[11px] text-surface/65">{new Date(latestPublication.published_at).toLocaleDateString('ko-KR')} 발행</p></div> : <div className="mt-6">
                <div className="flex items-end justify-between">
                  <span className="text-[11px] text-surface/55">이야기 준비도</span>
                  <span className="font-serif text-3xl font-bold">
                    {recordCount === 0 ? '첫 장' : `${readiness.score}%`}
                  </span>
                </div>
                {recordCount > 0 && <ProgressBar value={readiness.score} className="mt-2 [&>div]:bg-sage" />}
                <p className="mt-2 text-[11px] leading-5 text-surface/55">
                  {recordCount === 0 ? '첫 기록을 남기면 책이 시작됩니다.' : readiness.message}
                </p>
              </div>}
            </div>
          </div>

          <button
            type="button"
            className="mt-7 flex min-h-[52px] w-full items-center justify-between border-t border-surface/20 pt-4 text-left"
            onClick={() => navigate(isPublished ? `/publication/${latestPublication.id}` : '/record/mode')}
          >
            <span>
              <span className="block font-serif text-base font-bold">{isPublished ? '발행한 책 보기' : '오늘 한 페이지 쓰기'}</span>
              <span className="mt-1 block text-[11px] text-surface/55">{isPublished ? `PDF v${latestPublication.version} 열람·다운로드` : 'AI 질문 · 자유 기록 · 사진 기록'}</span>
            </span>
            <span className="text-xl">→</span>
          </button>
        </section>

        <section className="px-5 pt-8">
          <div className="flex items-end justify-between border-b border-ink pb-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-sage">PAGE'S NOTE</p>
              <h2 className="mt-1 font-serif text-lg font-bold">작은 편집 메모</h2>
            </div>
            <FlatIcon name="book" size={22} className="text-sage" />
          </div>

          <div className="py-5">
            <p className="font-serif text-[16px] font-semibold leading-7">
              {isPublished ? '당신의 이야기가 한 권의 책이 되었어요.' : readiness.isReady
                ? '이제 기록을 한 권의 이야기로 묶을 수 있어요.'
                : '지금은 잘 쓰는 것보다, 계속 남기는 것이 더 중요해요.'}
            </p>
            <p className="mt-2 text-xs leading-6 text-ink-muted">
              {isPublished ? `최신 발행본 v${latestPublication.version}을 확인하거나 책 작업실에서 다음 작업을 이어갈 수 있어요.` : readiness.isReady
                ? '책 작업실에서 PAGE와 함께 챕터의 연결점을 찾고 원고를 만들어보세요.'
                : `책 만들기까지 ${readiness.recordsRemaining > 0 ? `기록 ${readiness.recordsRemaining}개` : '기록 조건 충족'}${readiness.daysRemaining > 0 ? ` · ${readiness.daysRemaining}일` : ''}. 평범한 하루도 나중에는 책의 재료가 됩니다.`}
            </p>
            {(readiness.isReady || isPublished) && (
              <button
                type="button"
                className="mt-4 min-h-11 border-b border-ink text-sm font-semibold"
                onClick={() => navigate('/project/workspace')}
              >
                책 작업실 열기 →
              </button>
            )}
          </div>
        </section>

        <section className="px-5 pt-4">
          <div className="border-y border-border py-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">현재 기록</span>
              <span className="font-semibold">{recordCount} pages</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-ink-muted">책 상태</span>
              <span className="font-semibold">{isPublished ? `발행완료 · v${latestPublication.version}` : readiness.isReady ? '책 만들기 가능' : '기록 중'}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
