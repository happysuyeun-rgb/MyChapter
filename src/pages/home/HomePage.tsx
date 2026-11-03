import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeskProgress, EmptyState, ErrorState, FlatIcon, LoadingBlock } from '@/components/common'
import pageNoteImage from '@/assets/images/home/page-note/page_c.png'
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
  const isReady = readiness.isReady && !isPublished
  const bookTitle = latestPublication?.title_snapshot ?? project.title
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })

  const primary = isPublished
    ? {
        label: '발행한 책 보기',
        hint: `PDF v${latestPublication.version} 열람·다운로드`,
        to: `/publication/${latestPublication.id}`,
      }
    : isReady
      ? {
          label: '책 작업실 열기',
          hint: '기록을 한 권의 이야기로 묶을 수 있어요',
          to: '/project/workspace',
        }
      : {
          label: '오늘 한 페이지 쓰기',
          hint: 'AI 질문 · 자유 기록 · 사진 기록',
          to: '/record/mode',
        }

  const statusLabel = isPublished
    ? `발행완료 · v${latestPublication.version}`
    : readiness.isReady
      ? '책 만들기 가능'
      : '기록 중'

  return (
    <div className="desk-fade-in flex flex-1 flex-col overflow-y-auto bg-surface">
      {/* Brand masthead — hero-level signal */}
      <header className="px-5 pb-4 pt-6">
        <div className="flex h-11 items-center justify-between">
          <p className="font-serif text-[13px] font-bold tracking-[0.28em] text-ink">MY CHAPTER</p>
          <button
            type="button"
            aria-label="알림"
            className="relative -mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-ink"
            onClick={() => navigate('/notifications')}
          >
            <FlatIcon name="bell" size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-terracotta" />
            )}
          </button>
        </div>
        <p className="mt-4 text-[11px] tracking-[0.08em] text-ink-faint">{today}</p>
        <h1 className="mt-1 truncate font-serif text-[26px] font-bold leading-tight tracking-[-0.03em] text-ink">
          {profile?.nickname ?? '회원'}님 안녕하세요.
        </h1>
      </header>

      <main className="pb-10">
        {/* Desk blotter + book stage */}
        <section className="px-5">
          <div className="desk-ink-panel px-5 pb-6 pt-5 text-surface">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-[0.22em] text-surface/50">
                {isPublished ? 'PUBLISHED' : 'ON THE DESK'}
              </p>
              <button
                type="button"
                className="text-[11px] font-medium text-surface/70 underline-offset-2 hover:underline"
                onClick={() => navigate('/library')}
              >
                서재 보기
              </button>
            </div>

            <div className="mt-6 flex gap-5">
              <div className="flex h-44 w-[108px] shrink-0 flex-col justify-between rounded-r-md rounded-l-[3px] bg-[#F2E6D4] p-3.5 text-ink shadow-[10px_12px_0_rgba(0,0,0,.18)]">
                <span className="text-[7px] tracking-[0.18em] text-ink/45">MY CHAPTER</span>
                <div>
                  <span className="mb-3 block h-px w-8 bg-sage" />
                  <p className="line-clamp-5 font-serif text-[14px] font-bold leading-[1.4]">{bookTitle}</p>
                </div>
                <span className="text-[7px] text-ink/45">{typeLabel}</span>
              </div>

              <div className="min-w-0 flex-1 self-end pb-1">
                <p className="text-[11px] text-surface/55">{typeLabel}</p>
                <h2 className="mt-1.5 line-clamp-3 font-serif text-[22px] font-bold leading-snug tracking-[-0.02em]">
                  {bookTitle}
                </h2>
                {isPublished ? (
                  <div className="mt-5">
                    <p className="font-serif text-2xl font-bold">v{latestPublication.version}</p>
                    <p className="mt-1 text-[11px] text-surface/60">
                      {new Date(latestPublication.published_at).toLocaleDateString('ko-KR')} 발행
                    </p>
                  </div>
                ) : (
                  <DeskProgress
                    className="mt-5"
                    tone="ink"
                    score={readiness.score}
                    message={readiness.message}
                    recordCount={recordCount}
                  />
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="flex min-h-[52px] w-full items-center justify-center bg-[#F7F2E8] px-5 text-[15px] font-semibold text-ink transition-opacity active:translate-y-px active:opacity-90"
                onClick={() => navigate(primary.to)}
              >
                {primary.label}
              </button>
              <p className="mt-2.5 text-center text-[11px] text-surface/55">{primary.hint}</p>
            </div>

            {isReady && (
              <button
                type="button"
                className="mt-3 min-h-10 w-full text-center text-[12px] text-surface/70"
                onClick={() => navigate('/record/mode')}
              >
                계속 기록하기 →
              </button>
            )}
            {isPublished && (
              <button
                type="button"
                className="mt-3 min-h-10 w-full text-center text-[12px] text-surface/70"
                onClick={() => navigate('/project/workspace')}
              >
                책 작업실 열기 →
              </button>
            )}
          </div>
        </section>

        {/* Ledger strip */}
        <section className="mx-5 mt-5 grid grid-cols-2 border border-border bg-surface-card/80">
          <div className="border-r border-border px-4 py-3.5">
            <p className="text-[10px] tracking-[0.12em] text-ink-faint">PAGES</p>
            <p className="mt-1 font-serif text-xl font-bold">{recordCount}</p>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-[10px] tracking-[0.12em] text-ink-faint">STATUS</p>
            <p className="mt-1 font-serif text-sm font-bold leading-snug">{statusLabel}</p>
          </div>
        </section>

        {/* PAGE note — character + editorial quote */}
        <section className="px-5 pb-2 pt-8">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-sage">PAGE&apos;S NOTE</p>
          <div className="mt-4 flex items-center gap-4">
            <img
              src={pageNoteImage}
              alt="PAGE"
              width={104}
              height={104}
              className="h-[104px] w-[104px] shrink-0 object-contain"
              decoding="async"
            />
            <div className="quote-rule flex min-h-[104px] min-w-0 flex-1 items-center">
              <p className="font-serif text-[16px] font-semibold leading-7 text-ink">
                {isPublished
                  ? '당신의 이야기가 한 권의 책이 되었어요.'
                  : readiness.isReady
                    ? '이제 기록을 한 권의 이야기로 묶을 수 있어요.'
                    : '지금은 잘 쓰는 것보다, 계속 남기는 것이 더 중요해요.'}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
