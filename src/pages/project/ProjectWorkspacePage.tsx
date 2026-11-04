import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DeskProgress,
  ErrorState,
  LoadingBlock,
  StepperVisual,
  StudioSection,
  type StudioStep,
} from '@/components/common'
import { BrandMasthead } from '@/components/layout/BrandMasthead'
import bookDefaultCover from '@/assets/images/home/Book_defualt.png'
import pageNoteImage from '@/assets/images/home/page-note/page_c.png'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { useActiveProject } from '@/hooks/useActiveProject'
import { getPublishedBook } from '@/lib/api/books'
import { listChapters } from '@/lib/api/chapters'
import { listRecords } from '@/lib/api/records'
import { isDevBypass } from '@/lib/devBypass'
import { useAuthStore } from '@/stores/authStore'
import { getBookReadiness } from '@/utils/bookReadiness'

/** Indexed like `productionSteps`; drives the single primary CTA. */
const NEXT_STEP_COPY = [
  { title: '재료를 모으는 시간이에요', cta: '+ 오늘 기록하기', to: '/record/mode' },
  { title: '챕터를 만들어볼까요', cta: '챕터 만들기', to: '/book' },
  { title: '원고를 처음부터 읽어봐요', cta: '원고 확인하기', to: '/book/manuscript' },
  { title: '표지를 골라주세요', cta: '표지 고르기', to: '/book/cover' },
  { title: '마지막으로 확인해주세요', cta: '최종 검수하기', to: '/book/review' },
  { title: '이제 발행할 수 있어요', cta: '발행하러 가기', to: '/book/review' },
] as const

function formatMilestone(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

export function ProjectWorkspacePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { project, loading: projectLoading, error: projectError, retry: retryProject } = useActiveProject()
  const [recordCount, setRecordCount] = useState(0)
  const [chapterCount, setChapterCount] = useState(0)
  const [manuscriptComplete, setManuscriptComplete] = useState(false)
  const [finalReviewComplete, setFinalReviewComplete] = useState(false)
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null)
  const [publicationId, setPublicationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!user || !project) return
    let cancelled = false
    setLoadError(false)
    Promise.all([
      listRecords(user.id, { projectId: project.id }),
      listChapters(project.id),
      isDevBypass() ? Promise.resolve(null) : getPublishedBook(project.id),
    ])
      .then(([records, chapters, publication]) => {
        if (cancelled) return
        setRecordCount(records.length)
        setChapterCount(chapters.length)
        setManuscriptComplete(Boolean(project.manuscript_reviewed_at))
        setFinalReviewComplete(Boolean(project.final_review_completed_at))
        setPublishedVersion(
          isDevBypass() && project.is_completed
            ? 1
            : publication?.version ?? null,
        )
        setPublicationId(publication?.id ?? null)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [user, project, retryKey])

  if (projectError || loadError) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
        <ErrorState
          title="책 작업실을 불러오지 못했어요"
          onRetry={() => {
            if (projectError) retryProject()
            if (loadError) {
              setLoading(true)
              setRetryKey((k) => k + 1)
            }
          }}
        />
      </div>
    )
  }

  if (projectLoading || loading || !project) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
        <LoadingBlock label="책 작업실을 불러오는 중..." />
      </div>
    )
  }

  const readiness = getBookReadiness(project, recordCount)
  const typeLabel = PROJECT_TYPES.find((item) => item.type === project.type)?.label ?? '나의 이야기'
  const manuscriptReady = manuscriptComplete
  const coverSelected = Boolean(project.selected_cover_id ?? project.cover_template_id)
  const published = publishedVersion !== null

  const readinessLock = '이야기 준비도(기록·일수)가 채워지면 열려요'
  const chapterLock = '챕터를 먼저 만들면 열려요'
  const coverLock = '표지를 선택한 뒤 진행할 수 있어요'
  const makingLocked = !readiness.isReady

  const productionSteps: StudioStep[] = [
    {
      label: '기록',
      description: readiness.isReady
        ? `기록 ${recordCount}개 · 책 만들기 기준을 충족했어요`
        : `기록 ${recordCount}개를 모으고 있어요`,
      statusLabel: readiness.isReady ? '완료' : '진행 중',
      ready: true,
      state: readiness.isReady ? 'done' : 'active',
      onSelect: () => navigate('/records'),
    },
    {
      label: '챕터',
      description:
        chapterCount > 0
          ? `${chapterCount}개의 챕터가 만들어졌어요`
          : readiness.isReady
            ? '이야기가 충분히 모였어요. 챕터를 만들어보세요'
            : '이야기 준비도가 채워지면 열려요',
      statusLabel: chapterCount > 0 ? '완료' : readiness.isReady ? '시작 가능' : '대기',
      ready: readiness.isReady,
      lockReason: readinessLock,
      state: chapterCount > 0 ? 'done' : readiness.isReady ? 'active' : 'pending',
      onSelect: () => navigate('/book'),
    },
    {
      label: '원고',
      description: manuscriptReady
        ? `${formatMilestone(project.manuscript_reviewed_at)} 원고 확인 완료`
        : chapterCount > 0
          ? '챕터 원고를 처음부터 읽고 확인해요'
          : '챕터를 먼저 만든 뒤 원고를 확인해요',
      statusLabel: manuscriptReady ? '완료' : chapterCount > 0 ? '확인 필요' : '대기',
      ready: readiness.isReady && chapterCount > 0,
      lockReason: !readiness.isReady ? readinessLock : chapterLock,
      state: manuscriptReady ? 'done' : chapterCount > 0 ? 'active' : 'pending',
      onSelect: () => navigate('/book/manuscript'),
    },
    {
      label: '표지',
      description: coverSelected ? '표지 선택이 저장되어 있어요' : '아직 표지를 선택하지 않았어요',
      statusLabel: coverSelected ? '완료' : manuscriptReady ? '선택 필요' : '대기',
      ready: readiness.isReady && chapterCount > 0,
      lockReason: !readiness.isReady ? readinessLock : chapterLock,
      state: coverSelected ? 'done' : manuscriptReady ? 'active' : 'pending',
      onSelect: () => navigate('/book/cover'),
    },
    {
      label: '최종 검수',
      description: finalReviewComplete
        ? `${formatMilestone(project.final_review_completed_at)} 최종 검수 완료`
        : coverSelected
          ? '표지·목차·원고를 마지막으로 확인해주세요'
          : '표지 선택 후 진행할 수 있어요',
      statusLabel: finalReviewComplete ? '완료' : coverSelected ? '확인 필요' : '대기',
      ready: readiness.isReady && chapterCount > 0 && coverSelected,
      lockReason: !readiness.isReady ? readinessLock : !coverSelected ? coverLock : chapterLock,
      state: finalReviewComplete ? 'done' : coverSelected ? 'active' : 'pending',
      onSelect: () => navigate('/book/review'),
    },
    {
      label: '발행',
      description: published ? `PDF v${publishedVersion} 발행이 완료되었어요` : '아직 발행되지 않았어요',
      statusLabel: published ? `v${publishedVersion} 완료` : '미발행',
      ready: readiness.isReady && chapterCount > 0 && coverSelected,
      lockReason: !readiness.isReady ? readinessLock : !coverSelected ? coverLock : chapterLock,
      state: published ? 'done' : coverSelected ? 'active' : 'pending',
      onSelect: () => navigate(publicationId ? `/publication/${publicationId}` : '/book/review'),
    },
  ]

  const nextIndex = readiness.isReady
    ? productionSteps.findIndex((step) => step.ready && step.state !== 'done')
    : 0
  const nextCopy = NEXT_STEP_COPY[nextIndex] ?? NEXT_STEP_COPY[0]
  const nextStep = published
    ? {
        eyebrow: `PUBLISHED · v${publishedVersion}`,
        title: '이 책은 발행되었어요',
        description: '발행본은 그대로 보존돼요. 기록을 이어가면 다음 버전을 준비할 수 있어요.',
        cta: '발행본 보기',
        to: publicationId ? `/publication/${publicationId}` : '/mypage/completed-books',
      }
    : {
        eyebrow: nextIndex > 0 ? `NEXT STEP · ${String(nextIndex + 1).padStart(2, '0')}` : 'NEXT STEP',
        title: nextCopy.title,
        description: nextIndex > 0 ? productionSteps[nextIndex].description : readiness.message,
        cta: nextCopy.cta,
        to: nextCopy.to,
      }
  const showRecordLink = nextStep.to !== '/record/mode'

  return (
    <div className="desk-fade-in mx-auto min-h-dvh w-full max-w-phone overflow-y-auto bg-surface">
      <header className="px-5 pb-5 pt-4">
        <BrandMasthead
          left={
            <button
              type="button"
              className="flex min-h-11 items-center text-sm text-ink-muted"
              onClick={() => navigate('/library')}
              aria-label="서재로"
            >
              ←
            </button>
          }
          right={
            <button
              type="button"
              className="min-h-11 text-[11px] font-semibold text-ink-muted"
              onClick={() => navigate('/project/settings')}
            >
              책 설정
            </button>
          }
        />
        <div className="mt-4 flex gap-5">
          <div className="relative h-32 w-[86px] shrink-0">
            <img
              src={bookDefaultCover}
              alt=""
              width={86}
              height={128}
              className="h-full w-full object-contain drop-shadow-[6px_8px_0_rgba(59,53,45,.12)]"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-x-[10%] top-[10%] flex h-[40%] items-center justify-center px-0.5">
              <span className="line-clamp-4 text-center font-serif text-[10px] font-bold leading-[1.35] text-ink">
                {project.title}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-sage">BOOK WORKSPACE</p>
            <h1 className="mt-2 line-clamp-2 font-serif text-[24px] font-bold leading-snug tracking-[-0.03em]">
              {project.title}
            </h1>
            <p className="mt-2 text-xs text-ink-muted">
              {typeLabel} · 기록 {recordCount}개
            </p>
          </div>
        </div>
        <div className="shelf-rail mt-5 h-1.5 w-full" aria-hidden />
      </header>

      <main className="px-5 pb-8">
        <section className="border-b border-border pb-7">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-sage">{nextStep.eyebrow}</p>
          <h2 className="mt-1 font-serif text-lg font-bold tracking-[-0.02em] text-ink">{nextStep.title}</h2>
          <p className="mt-2 text-xs leading-5 text-ink-muted">{nextStep.description}</p>
          <button
            type="button"
            className="mt-5 min-h-[48px] w-full border border-ink bg-ink px-4 py-3.5 text-sm font-semibold text-surface"
            onClick={() => navigate(nextStep.to)}
          >
            {nextStep.cta}
          </button>
          {showRecordLink && (
            <button
              type="button"
              className="mt-3 min-h-11 w-full text-center text-xs font-semibold text-ink-muted"
              onClick={() => navigate('/record/mode')}
            >
              + 오늘 기록하기
            </button>
          )}
        </section>

        <StudioSection eyebrow="READINESS" title="이야기 준비도" meta={`${readiness.score}%`}>
          <div className="border border-border bg-surface-card/80 px-4 py-4">
            <DeskProgress
              tone="paper"
              score={readiness.score}
              message={readiness.message}
              recordCount={recordCount}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
              {readiness.isReady
                ? `기록 ${recordCount}개 · ${readiness.elapsedDays}일 동안 이야기를 모았어요.`
                : `기록 ${recordCount}/${readiness.rule.minRecords}개 · ${readiness.elapsedDays}/${readiness.rule.minDays}일 · 책 만들기까지 ${readiness.recordsRemaining > 0 ? `기록 ${readiness.recordsRemaining}개` : ''}${readiness.recordsRemaining > 0 && readiness.daysRemaining > 0 ? ' · ' : ''}${readiness.daysRemaining > 0 ? `${readiness.daysRemaining}일` : ''}`}
            </p>
          </div>
        </StudioSection>

        <StudioSection
          eyebrow="PRODUCTION"
          title="이 책을 완성하는 과정"
          meta="01 — 06"
          locked={makingLocked}
          lockReason={
            makingLocked
              ? '지금은 기록을 모으는 시간이에요. 준비도가 채워지면 챕터부터 열려요.'
              : undefined
          }
        >
          <StepperVisual steps={productionSteps} />
        </StudioSection>

        <StudioSection eyebrow="PAGE" title="PAGE의 편집 메모">
          <div className="flex items-center gap-4">
            <img
              src={pageNoteImage}
              alt="PAGE"
              width={88}
              height={88}
              className="h-[88px] w-[88px] shrink-0 object-contain"
              decoding="async"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">작은 편집 메모</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {readiness.isReady
                  ? '이제 기록을 챕터와 원고로 발전시킬 수 있어요.'
                  : '지금은 완성보다 재료를 모으는 시간이에요. 기간과 기록이 함께 쌓이면 책 만들기가 열려요.'}
              </p>
            </div>
          </div>
        </StudioSection>
      </main>
    </div>
  )
}
