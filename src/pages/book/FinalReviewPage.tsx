import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '@/components/common'
import { COVER_TEMPLATES } from '@/constants/coverTemplates'
import { useActiveProject } from '@/hooks/useActiveProject'
import { canPublishBook, downloadPdfFromUrl, generateBookPdf, BookApiError } from '@/lib/api/books'
import { listChapters } from '@/lib/api/chapters'
import { listRecords } from '@/lib/api/records'
import { getSubscriptionPlan } from '@/lib/api/subscriptions'
import { useAuthStore } from '@/stores/authStore'
import { useBookStore } from '@/stores/bookStore'
import { usePaywallStore } from '@/stores/paywallStore'
import type { Chapter } from '@/types/database'
import { getBookReadiness } from '@/utils/bookReadiness'

export function FinalReviewPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { project, loading: projectLoading } = useActiveProject()
  const { selectedCoverId, setPublishResult, publishStage, publishError, setPublishStage } = useBookStore()
  const { showPaywall } = usePaywallStore()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [recordCount, setRecordCount] = useState(0)
  const [isPro, setIsPro] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [checks, setChecks] = useState({ cover: false, toc: false, manuscript: false })
  const [publishing, setPublishing] = useState(false)
  const [readinessChecked, setReadinessChecked] = useState(false)

  useEffect(() => {
    if (!user || !project) return
    void Promise.all([
      listChapters(project.id),
      listRecords(user.id, { projectId: project.id }),
      getSubscriptionPlan(user.id),
      canPublishBook(user.id),
    ]).then(([chapterData, records, plan, canPublish]) => {
      setChapters(chapterData)
      setRecordCount(records.length)
      setIsPro(plan === 'pro')
      setAllowed(canPublish)
      if (!getBookReadiness(project, records.length).isReady) navigate('/project/workspace', { replace: true })
      setReadinessChecked(true)
    })
  }, [user, project, navigate])

  if (projectLoading || !project || !readinessChecked) return <div className="flex min-h-dvh items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>

  const cover = COVER_TEMPLATES.find((item) => item.id === selectedCoverId)
  const ready = checks.cover && checks.toc && checks.manuscript && chapters.length > 0

  const publish = async () => {
    if (!user || !ready) return
    if (!allowed) { showPaywall(); return }
    setPublishing(true)
    setPublishStage('cover')
    try {
      setPublishStage('toc')
      setPublishStage('body')
      setPublishStage('pdf')
      const result = await generateBookPdf(project.id, selectedCoverId)
      downloadPdfFromUrl(result.pdfUrl, project.title + '.pdf')
      setPublishResult({ project, recordCount, pageCount: result.pageCount, coverTemplateId: selectedCoverId })
      setPublishStage('done')
      navigate('/book/publish/complete')
    } catch (error) {
      if (error instanceof BookApiError && error.code === 'PUBLICATION_LIMIT') {
        setPublishStage('idle')
        showPaywall()
      } else {
        setPublishStage('error', 'PDF 생성 중 문제가 발생했어요. 다시 시도해주세요.')
      }
    } finally { setPublishing(false) }
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-phone overflow-y-auto bg-surface">
      <header className="px-5 pb-4 pt-6"><button className="text-sm text-ink-muted" onClick={() => navigate('/book/cover')}>← 표지</button><p className="mt-6 text-xs font-semibold tracking-[0.18em] text-sage">FINAL REVIEW</p><h1 className="mt-1 font-serif text-2xl font-bold">마지막으로 확인해주세요</h1><p className="mt-2 text-sm text-ink-muted">발행 전 책의 표지, 목차와 원고를 확인해요.</p></header>
      <main className="px-5 pb-8">
        <Card className="paper-card p-4">
          <div className="flex gap-4"><div className={['flex h-24 w-16 shrink-0 items-center justify-center rounded-r-md rounded-l-sm', cover?.bgClass ?? 'bg-accent', cover?.textClass ?? 'text-white'].join(' ')}><span className={['h-px w-8', cover?.accentClass ?? 'bg-sage'].join(' ')} /></div><div><p className="font-serif text-lg font-bold">{project.title}</p><p className="mt-1 text-xs text-ink-muted">{profile?.nickname ?? '작가'} · 챕터 {chapters.length}개</p><button className="mt-4 text-xs font-semibold text-sage" onClick={() => navigate('/book/cover')}>표지 변경 →</button></div></div>
        </Card>
        <section className="mt-6"><p className="mb-3 font-serif text-base font-bold">목차</p><Card className="divide-y divide-border overflow-hidden">{chapters.map((chapter) => <button key={chapter.id} className="flex w-full items-center gap-3 p-4 text-left" onClick={() => navigate('/book/chapter/' + chapter.id)}><span className="text-xs text-ink-faint">{String(chapter.chapter_number).padStart(2,'0')}</span><span className="flex-1 text-sm font-semibold">{chapter.title}</span><span className="text-ink-faint">›</span></button>)}</Card></section>
        <section className="mt-6"><p className="mb-3 font-serif text-base font-bold">발행 체크</p><Card className="p-2">{[['cover','표지 확인'],['toc','목차 순서 확인'],['manuscript','원고 최종 확인']].map(([key,label]) => <label key={key} className="flex items-center gap-3 p-3 text-sm"><input type="checkbox" checked={checks[key as keyof typeof checks]} onChange={(e) => setChecks((prev) => ({ ...prev, [key]: e.target.checked }))} /><span>{label}</span></label>)}</Card></section>
        <Card className="mt-6 border-sage/30 bg-accent-light/50 p-4"><p className="text-sm font-semibold">{isPro ? 'Pro · 반복 발행 가능' : allowed ? 'Free · 첫 책 발행 1회 사용 가능' : 'Free · 첫 책 발행 사용 완료'}</p><p className="mt-1 text-xs leading-relaxed text-ink-muted">{isPro ? '이 책을 포함해 계속 새로운 책을 발행할 수 있어요.' : allowed ? '첫 번째 책은 무료로 끝까지 완성하고 PDF로 발행할 수 있어요.' : '다음 책 발행부터는 Pro가 필요해요.'}</p></Card>
        {publishing && (
          <Card className="mt-6 p-4">
            <p className="text-sm font-semibold">책을 만들고 있어요</p>
            <div className="mt-3 space-y-2 text-xs text-ink-muted">
              {[
                ['cover', '표지 준비'],
                ['toc', '목차 구성'],
                ['body', '원고 정리'],
                ['pdf', 'PDF 생성'],
              ].map(([stage, label]) => {
                const order = ['cover', 'toc', 'body', 'pdf']
                const current = order.indexOf(publishStage)
                const index = order.indexOf(stage)
                const done = current > index || publishStage === 'done'
                const active = current === index
                return <div key={stage} className="flex items-center gap-2"><span className={['h-2 w-2 rounded-full', done ? 'bg-sage' : active ? 'bg-terracotta' : 'bg-surface-alt'].join(' ')} /><span>{done ? '완료' : active ? '진행중' : '대기'} · {label}</span></div>
              })}
            </div>
          </Card>
        )}
        {publishStage === 'error' && (
          <Card className="mt-6 border-terracotta/30 p-4">
            <p className="text-sm font-semibold">발행을 완료하지 못했어요</p>
            <p className="mt-1 text-xs text-ink-muted">{publishError}</p>
            <button className="mt-3 text-xs font-semibold text-terracotta" onClick={() => void publish()}>다시 시도하기 →</button>
          </Card>
        )}
        <Button className="mt-6" disabled={!ready || publishing} onClick={() => void publish()}>{publishing ? '책을 만들고 있어요...' : allowed ? '이 책 발행하기' : 'Pro로 계속 발행하기'}</Button>
      </main>
    </div>
  )
}
