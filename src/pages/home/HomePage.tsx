import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, DeskProgress, EmptyState, ErrorState, FlatIcon, LoadingBlock } from '@/components/common'
import { BrandMasthead } from '@/components/layout/BrandMasthead'
import bookDefaultCover from '@/assets/images/home/Book_defualt.png'
import jandiImage from '@/assets/images/home/jandi.png'
import pageNoteImage from '@/assets/images/home/page-note/page_c.png'
import { getUnreadCount } from '@/lib/api/notifications'
import { getPublishedBook, type PublishedBook } from '@/lib/api/books'
import { isDevBypass } from '@/lib/devBypass'
import { getProjects } from '@/lib/api/projects'
import { listRecords } from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import type { JournalRecord, Project } from '@/types/database'
import { getBookReadiness } from '@/utils/bookReadiness'

function formatRecordDate(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

function recordStatusLabel(record: JournalRecord) {
  if (record.chapter_id) return 'AI 편집 완료'
  if (record.mode === 'question') return 'AI 질문'
  if (record.mode === 'photo') return '사진 기록'
  return '자유 기록'
}

export function HomePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { activeProjectId, setActiveProject } = useProjectStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [recordCount, setRecordCount] = useState(0)
  const [latestRecord, setLatestRecord] = useState<JournalRecord | null>(null)
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
          setLatestRecord(records[0] ?? null)
          setLatestPublication(publication)
          setUnreadCount(unread)
        } else {
          setLatestPublication(null)
          setLatestRecord(null)
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
  const readiness = getBookReadiness(project, recordCount)
  const isPublished = latestPublication !== null
  const bookTitle = latestPublication?.title_snapshot ?? project.title

  const primary = isPublished
    ? {
        label: '발행한 책 보기',
        hint: `PDF v${latestPublication.version} 열람·다운로드`,
        to: `/publication/${latestPublication.id}`,
      }
    : {
        label: '오늘 한 페이지 쓰기',
        hint: '',
        to: '/library',
      }

  return (
    <div className="desk-fade-in flex flex-1 flex-col overflow-y-auto bg-surface">
      {/* Brand masthead — hero-level signal */}
      <header className="bg-surface-alt px-5 py-2">
        <BrandMasthead
          right={
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
          }
        />
      </header>

      <section className="flex items-center gap-3 bg-surface px-5 py-5">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-5 text-ink">
            안녕하세요, {profile?.nickname ?? '회원'}님{' '}
            <span aria-hidden>🌱</span>
          </p>
          <h1 className="mt-2 font-serif text-[26px] font-bold leading-[1.35] tracking-[-0.02em] text-[#3A4638]">
            당신의 이야기가
            <br />
            한 권의 책이 됩니다.
          </h1>
          <p className="mt-3 text-[12px] leading-5 text-ink-muted">
            하루를 기록하고, 삶을 한 권으로.
            <br />
            지금 당신의 첫 챕터를 시작해보세요.
          </p>
        </div>
        <img
          src={jandiImage}
          alt=""
          width={112}
          height={112}
          className="h-[112px] w-[112px] shrink-0 object-contain"
          decoding="async"
        />
      </section>
      <div className="mx-5 border-b border-ink" aria-hidden />

      <main className="pb-10">
        <section className="px-5 pt-5 text-ink">
          <div className="flex flex-col items-center">
            <button
              type="button"
              className="relative w-[200px] shrink-0 active:translate-y-px"
              onClick={() => navigate('/library')}
              aria-label={`${bookTitle} 서재로 이동`}
            >
              <img
                src={bookDefaultCover}
                alt=""
                width={200}
                height={300}
                className="h-auto w-full object-contain drop-shadow-[6px_10px_0_rgba(59,53,45,.10)]"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-x-[14%] top-[10%] flex h-[42%] flex-col items-center justify-center gap-2 px-1">
                <Badge variant={isPublished ? 'accent' : 'gray'}>
                  {isPublished ? '발행완료' : readiness.isReady ? '발행가능' : '진행중'}
                </Badge>
                <h2 className="line-clamp-4 text-center font-serif text-[22px] font-bold leading-snug tracking-[-0.02em] text-ink">
                  {bookTitle}
                </h2>
              </div>
            </button>

            {isPublished ? (
              <div className="mt-5 w-full text-center">
                <p className="font-serif text-2xl font-bold text-ink">v{latestPublication.version}</p>
                <p className="mt-1 text-[11px] text-ink-muted">
                  {new Date(latestPublication.published_at).toLocaleDateString('ko-KR')} 발행
                </p>
              </div>
            ) : (
              <DeskProgress
                className="mt-2 w-1/2"
                tone="paper"
                compactScore
                score={readiness.score}
                message={readiness.message}
                recordCount={recordCount}
              />
            )}
          </div>

          <div className="mt-6">
            <button
              type="button"
              className="flex min-h-[52px] w-full items-center justify-center border border-ink bg-transparent px-5 text-[15px] font-semibold text-ink transition-opacity active:translate-y-px active:opacity-90"
              onClick={() => navigate(primary.to)}
            >
              {primary.label}
            </button>
            {primary.hint ? (
              <p className="mt-2.5 text-center text-[11px] text-ink-muted">{primary.hint}</p>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              {
                icon: 'chat' as const,
                iconClass: 'text-sage',
                title: 'AI 질문으로 기록',
                description: 'AI가 오늘의 질문을 통해 기록을 도와드려요.',
                to: '/record/write/question',
              },
              {
                icon: 'pen' as const,
                iconClass: 'text-ink',
                title: '자유롭게 기록',
                description: '떠오르는 생각과 감정을 자유롭게 남겨보세요.',
                to: '/record/write/free',
              },
            ].map((item) => (
              <button
                key={item.to}
                type="button"
                className="flex min-h-[118px] flex-col items-start rounded-2xl border border-border bg-surface-card px-3.5 pb-4 pt-3.5 text-left shadow-paper active:translate-y-px"
                onClick={() => navigate(item.to)}
              >
                <FlatIcon name={item.icon} size={22} className={item.iconClass} />
                <span className="mt-3 text-[13px] font-bold leading-snug text-ink">{item.title}</span>
                <span className="mt-1.5 text-[11px] leading-4 text-ink-muted">{item.description}</span>
              </button>
            ))}
          </div>

          <section className="mt-5 rounded-2xl border border-border bg-transparent px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold text-ink">최근 기록</h2>
              <button
                type="button"
                className="text-[12px] font-medium text-ink-muted"
                onClick={() => navigate('/records')}
              >
                전체 보기 &gt;
              </button>
            </div>

            {latestRecord ? (
              <button
                type="button"
                className="mt-3 flex w-full items-start gap-3 text-left active:opacity-90"
                onClick={() => navigate(`/records/${latestRecord.id}`)}
              >
                {/* Polaroid slot — asset to be added later */}
                <div
                  className="h-[88px] w-[76px] shrink-0 rounded-sm bg-transparent"
                  aria-hidden
                />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="line-clamp-1 text-[14px] font-bold leading-snug text-ink">
                    {latestRecord.title?.trim() ||
                      latestRecord.content.trim().slice(0, 24) ||
                      `PAGE ${String(latestRecord.record_number).padStart(2, '0')}`}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-ink-muted">
                    {latestRecord.content.trim() || '내용 없는 기록이에요.'}
                  </p>
                  <p className="mt-2 text-[10px] leading-4 text-ink-faint">
                    <span>{formatRecordDate(latestRecord.created_at)}</span>
                    <span className="mx-1.5">|</span>
                    <span>{latestRecord.content.length.toLocaleString('ko-KR')}자</span>
                    <span className="mx-1.5">|</span>
                    <span className="text-sage">{recordStatusLabel(latestRecord)}</span>
                  </p>
                </div>
                <span
                  className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-[14px] leading-none text-ink-faint"
                  aria-hidden
                >
                  ···
                </span>
              </button>
            ) : (
              <p className="mt-4 text-[12px] leading-5 text-ink-muted">
                아직 기록이 없어요. 오늘 한 페이지부터 남겨보세요.
              </p>
            )}
          </section>
        </section>

        <section className="px-5 pb-2 pt-8">
          <div className="flex items-center gap-2">
            <img
              src={pageNoteImage}
              alt="PAGE"
              width={104}
              height={104}
              className="h-[104px] w-[104px] shrink-0 object-contain"
              decoding="async"
            />
            <div className="flex min-h-[104px] min-w-0 flex-1 items-center">
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
