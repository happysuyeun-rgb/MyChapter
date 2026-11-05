import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ErrorState, LoadingBlock, Modal, StudioSection } from '@/components/common'
import { BrandMasthead } from '@/components/layout/BrandMasthead'
import { COVER_TEMPLATES } from '@/constants/coverTemplates'
import { useActiveProject } from '@/hooks/useActiveProject'
import { canPublishBook, downloadPdfFromUrl, generateBookPdf, BookApiError } from '@/lib/api/books'
import { getChapterRecordCountMap, listChapters } from '@/lib/api/chapters'
import { listRecords } from '@/lib/api/records'
import { completeFinalReview, reopenFinalReview } from '@/lib/api/projects'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuthStore } from '@/stores/authStore'
import { useBookStore } from '@/stores/bookStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { useProjectStore } from '@/stores/projectStore'
import type { Chapter } from '@/types/database'
import { getBookReadiness } from '@/utils/bookReadiness'

const CHECK_ITEMS = [
  ['cover', '표지 확인'],
  ['toc', '목차 순서 확인'],
  ['manuscript', '원고 최종 확인'],
] as const

const PUBLISH_STAGES = [
  ['cover', '표지 준비'],
  ['toc', '목차 구성'],
  ['body', '원고 정리'],
  ['pdf', 'PDF 생성'],
] as const

function chapterLength(chapter: Chapter): number {
  return (chapter.user_content ?? chapter.ai_content ?? '').replace(/\s/g, '').length
}

function formatLength(length: number): string {
  if (length < 100) return `${length}자`
  return `약 ${(Math.round(length / 100) * 100).toLocaleString()}자`
}

export function FinalReviewPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { project, loading: projectLoading, error: projectError, retry: retryProject } = useActiveProject()
  const { selectedCoverId, setPublishResult, publishStage, publishError, setPublishStage, resetPublishState } = useBookStore()
  const { showPaywall } = usePaywallStore()
  const { setActiveProject } = useProjectStore()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapterRecordCounts, setChapterRecordCounts] = useState<Record<string, number>>({})
  const [recordCount, setRecordCount] = useState(0)
  const { isPro } = useSubscription()
  const [freeAllowed, setFreeAllowed] = useState(false)
  const allowed = isPro || freeAllowed
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)
  const [checks, setChecks] = useState({ cover: false, toc: false, manuscript: false })
  const [publishing, setPublishing] = useState(false)
  const [reviewSaved, setReviewSaved] = useState(false)
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [readinessChecked, setReadinessChecked] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    resetPublishState()
  }, [resetPublishState])

  useEffect(() => {
    if (!user || !project) return
    let cancelled = false
    setLoadError(false)
    Promise.all([
      listChapters(project.id),
      listRecords(user.id, { projectId: project.id }),
      canPublishBook(user.id),
      getChapterRecordCountMap(project.id),
    ])
      .then(([chapterData, records, canPublish, recordCounts]) => {
        if (cancelled) return
        setChapters(chapterData)
        setChapterRecordCounts(recordCounts)
        setReviewSaved(Boolean(project.final_review_completed_at))
        if (project.final_review_completed_at) setChecks({ cover: true, toc: true, manuscript: true })
        setRecordCount(records.length)
        setFreeAllowed(canPublish)
        if (!getBookReadiness(project, records.length).isReady) {
          navigate('/project/workspace', { replace: true })
          return
        }
        if (!(project.selected_cover_id ?? project.cover_template_id)) {
          navigate('/book/cover', { replace: true })
          return
        }
        setReadinessChecked(true)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => { cancelled = true }
  }, [user, project, navigate, retryKey])

  if (projectError || loadError) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
        <ErrorState
          title="최종 검수 정보를 불러오지 못했어요"
          onRetry={() => {
            if (projectError) retryProject()
            if (loadError) setRetryKey((k) => k + 1)
          }}
        />
      </div>
    )
  }

  if (projectLoading || !project || !readinessChecked) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
        <LoadingBlock label="최종 검수 정보를 불러오는 중..." />
      </div>
    )
  }

  const effectiveCoverId = project.selected_cover_id ?? project.cover_template_id ?? selectedCoverId
  const cover = COVER_TEMPLATES.find((item) => item.id === effectiveCoverId)
  const emptyChapterCount = chapters.filter((chapter) => chapterLength(chapter) === 0).length
  const hasEmptyChapter = emptyChapterCount > 0
  const ready = checks.cover && checks.toc && checks.manuscript && chapters.length > 0 && !hasEmptyChapter

  const confirmReview = async () => {
    if (!user || !project || !ready || reviewSaving) return
    setReviewSaving(true)
    setReviewError(null)
    try {
      const updated = await completeFinalReview(project.id, user.id)
      setActiveProject(updated)
      setReviewSaved(true)
    } catch {
      setReviewError('최종 검수 완료 상태를 저장하지 못했어요. 다시 시도해주세요.')
    } finally {
      setReviewSaving(false)
    }
  }

  const reopenReview = async () => {
    if (!user || !project || reviewSaving || publishing) return
    setReviewSaving(true)
    setReviewError(null)
    try {
      const updated = await reopenFinalReview(project.id, user.id)
      setActiveProject(updated)
      setReviewSaved(false)
      setChecks({ cover: false, toc: false, manuscript: false })
    } catch {
      setReviewError('검수 상태를 변경하지 못했어요. 다시 시도해주세요.')
    } finally {
      setReviewSaving(false)
    }
  }

  const requestPublish = () => {
    if (!user || !ready || !reviewSaved || publishing) return
    if (!allowed) { showPaywall(); return }
    setPublishConfirmOpen(true)
  }

  const publish = async () => {
    if (!user || !ready || !reviewSaved) return
    if (!allowed) { showPaywall(); return }
    setPublishConfirmOpen(false)
    setPublishing(true)
    setPublishStage('cover')
    try {
      setPublishStage('toc')
      setPublishStage('body')
      setPublishStage('pdf')
      const result = await generateBookPdf(project.id, effectiveCoverId)
      downloadPdfFromUrl(result.pdfUrl, project.title + '.pdf')
      setPublishResult({
        project,
        recordCount,
        pageCount: result.pageCount,
        coverTemplateId: effectiveCoverId,
        publicationId: result.publicationId,
        version: result.version,
      })
      setPublishStage('done')
      navigate('/book/publish/complete')
    } catch (error) {
      if (error instanceof BookApiError && error.code === 'PUBLICATION_LIMIT') {
        setPublishStage('idle')
        showPaywall()
      } else if (error instanceof BookApiError && error.code === 'PUBLICATION_IN_PROGRESS') {
        setPublishStage('error', error.message)
      } else if (error instanceof BookApiError && ['REVIEW_REQUIRED', 'COVER_MISMATCH', 'MANUSCRIPT_INCOMPLETE'].includes(error.code)) {
        setPublishStage('error', error.message)
        setReviewSaved(false)
      } else if (error instanceof BookApiError) {
        setPublishStage('error', error.message || 'PDF 생성 중 문제가 발생했어요. 다시 시도해주세요.')
      } else {
        setPublishStage('error', 'PDF 생성 중 문제가 발생했어요. 다시 시도해주세요.')
      }
    } finally { setPublishing(false) }
  }

  return (
    <div className="desk-fade-in mx-auto min-h-dvh w-full max-w-phone overflow-y-auto bg-surface">
      <header className="px-5 pb-5 pt-4">
        <BrandMasthead
          left={
            <button
              type="button"
              className="flex min-h-11 items-center text-sm text-ink-muted"
              onClick={() => navigate('/book/cover')}
              aria-label="표지로"
            >
              ←
            </button>
          }
        />
        <div className="mt-4">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-sage">FINAL REVIEW</p>
          <h1 className="mt-1 font-serif text-[26px] font-bold tracking-[-0.03em]">마지막으로 확인해주세요</h1>
          <p className="mt-2 text-xs leading-5 text-ink-muted">발행 전 표지, 목차, 원고를 한 번 더 확인해요.</p>
        </div>
        <div className="shelf-rail mt-5 h-1.5 w-full" aria-hidden />
      </header>

      <main className="px-5 pb-10">
        <StudioSection eyebrow="COVER" title="표지">
          <div className="flex gap-5">
            <div className={['flex h-28 w-[76px] shrink-0 items-center justify-center rounded-r-md rounded-l-sm drop-shadow-[5px_6px_0_rgba(59,53,45,.10)]', cover?.bgClass ?? 'bg-accent', cover?.textClass ?? 'text-white'].join(' ')}>
              <span className={['h-px w-8', cover?.accentClass ?? 'bg-sage'].join(' ')} />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p className="line-clamp-2 font-serif text-lg font-bold leading-snug">{project.title}</p>
              <p className="mt-1 text-xs text-ink-muted">{profile?.nickname ?? '작가'} · 챕터 {chapters.length}개</p>
              <button type="button" className="mt-4 min-h-11 text-xs font-semibold text-sage" onClick={() => navigate('/book/cover')}>
                표지 변경 →
              </button>
            </div>
          </div>
        </StudioSection>

        <StudioSection eyebrow="CONTENTS" title="목차" meta={`${chapters.length}장`}>
          <div className="border-t border-border">
            {chapters.map((chapter) => {
              const length = chapterLength(chapter)
              const empty = length === 0
              return (
                <button
                  key={chapter.id}
                  type="button"
                  className="flex w-full items-start gap-4 border-b border-border py-4 text-left active:bg-accent-light/30"
                  onClick={() => navigate(empty ? `/book/chapter/${chapter.id}/edit` : `/book/chapter/${chapter.id}`)}
                >
                  <span className="w-6 shrink-0 pt-0.5 font-serif text-sm font-bold text-ink-faint">
                    {String(chapter.chapter_number).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-[15px] font-bold leading-snug text-ink">{chapter.title}</span>
                    {empty ? (
                      <span className="mt-1 block text-[11px] font-semibold text-terracotta">원고가 비어 있어요</span>
                    ) : (
                      <span className="mt-1 block text-[11px] text-ink-muted">
                        기록 {chapterRecordCounts[chapter.id] ?? 0}개 · {formatLength(length)}
                      </span>
                    )}
                  </span>
                  <span className="pt-0.5 text-ink-faint" aria-hidden>›</span>
                </button>
              )
            })}
          </div>
          <button type="button" className="mt-3 min-h-11 text-xs font-semibold text-sage" onClick={() => navigate('/book')}>
            목차 순서 바꾸기 →
          </button>
        </StudioSection>

        <StudioSection eyebrow="CHECKLIST" title="발행 체크">
          <div className="border-t border-border">
            {CHECK_ITEMS.map(([key, label]) => {
              const blocked = key === 'manuscript' && hasEmptyChapter
              return (
                <label
                  key={key}
                  className={['flex min-h-12 items-center gap-3 border-b border-border py-3 text-sm', blocked ? 'opacity-55' : ''].join(' ')}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-ink"
                    checked={checks[key]}
                    disabled={reviewSaved || reviewSaving || publishing || blocked}
                    onChange={(e) => setChecks((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  <span className="flex-1">{label}</span>
                </label>
              )
            })}
          </div>
          {hasEmptyChapter && (
            <p className="mt-3 text-[11px] leading-4 text-terracotta">
              비어 있는 챕터 {emptyChapterCount}개를 먼저 채워주세요.
            </p>
          )}
        </StudioSection>

        <div className="mt-8 border-l-2 border-sage pl-4">
          <p className="text-sm font-semibold">{isPro ? 'Pro · 반복 발행 가능' : allowed ? 'Free · 첫 책 발행 1회 사용 가능' : 'Free · 첫 책 발행 사용 완료'}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{isPro ? '이 책을 포함해 계속 새로운 책을 발행할 수 있어요.' : allowed ? '첫 번째 책은 무료로 끝까지 완성하고 PDF로 발행할 수 있어요.' : '다음 책 발행부터는 Pro가 필요해요.'}</p>
        </div>

        {publishing && (
          <section className="mt-6 border-y border-border py-5">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-sage">PUBLISHING</p>
            <p className="mt-2 font-serif text-base font-bold">책을 만들고 있어요</p>
            <div className="mt-4 space-y-3 text-xs text-ink-muted">
              {PUBLISH_STAGES.map(([stage, label]) => {
                const order = PUBLISH_STAGES.map(([item]) => item as string)
                const current = order.indexOf(publishStage)
                const index = order.indexOf(stage)
                const done = current > index || publishStage === 'done'
                const active = current === index
                return <div key={stage} className="flex items-center gap-2"><span className={['h-2 w-2 rounded-full', done ? 'bg-sage' : active ? 'bg-terracotta' : 'bg-surface-alt'].join(' ')} /><span>{done ? '완료' : active ? '진행중' : '대기'} · {label}</span></div>
              })}
            </div>
          </section>
        )}

        {publishStage === 'error' && (
          <section className="mt-6 border-y border-terracotta/40 py-5">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-terracotta">PUBLISH FAILED</p>
            <p className="mt-2 font-serif text-base font-bold">발행을 완료하지 못했어요</p>
            <p className="mt-2 text-xs text-ink-muted">{publishError}</p>
            <button type="button" className="mt-4 min-h-11 border-b border-terracotta text-xs font-semibold text-terracotta" onClick={() => void publish()}>다시 시도하기 →</button>
          </section>
        )}

        {reviewError && <p role="alert" className="mt-4 text-xs text-terracotta">{reviewError}</p>}

        {reviewSaved ? (
          <>
            <Button className="mt-8" disabled={!ready || publishing} onClick={requestPublish}>
              {publishing ? '책을 만들고 있어요...' : allowed ? '이 책 발행하기' : 'Pro로 계속 발행하기'}
            </Button>
            <button
              type="button"
              className="mt-3 min-h-11 w-full text-center text-xs font-semibold text-ink-muted"
              disabled={reviewSaving || publishing}
              onClick={() => void reopenReview()}
            >
              검수 다시 하기
            </button>
          </>
        ) : (
          <Button className="mt-8" disabled={!ready || reviewSaving} onClick={() => void confirmReview()}>
            {reviewSaving ? '검수 저장 중...' : '최종 검수 완료 저장'}
          </Button>
        )}
      </main>

      <Modal open={publishConfirmOpen} onClose={() => setPublishConfirmOpen(false)} title="이 책을 발행할까요?">
        <p className="mb-5 text-sm leading-6 text-ink-muted">
          {isPro
            ? '지금 원고와 표지로 PDF를 만들어요. 발행본은 버전으로 남고, 나중에 고쳐서 다시 발행할 수 있어요.'
            : 'Free의 첫 책 발행 1회를 사용해요. 발행 후 원고를 고쳐 다시 발행하려면 Pro가 필요해요.'}
        </p>
        <Button onClick={() => void publish()}>발행하기</Button>
        <Button variant="ghost" className="mt-2" onClick={() => setPublishConfirmOpen(false)}>조금 더 볼게요</Button>
      </Modal>
    </div>
  )
}
