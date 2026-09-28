import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLottie, Button, Card } from '@/components/common'
import confettiAnimation from '@/assets/animations/confetti-burst.json'
import { COVER_TEMPLATES } from '@/constants/coverTemplates'
import { useBookStore } from '@/stores/bookStore'

export function PublishCompletePage() {
  const navigate = useNavigate()
  const { publishResult, clearPublishResult } = useBookStore()

  useEffect(() => {
    if (!publishResult) {
      navigate('/book', { replace: true })
    }
  }, [publishResult, navigate])

  if (!publishResult) return null

  const { project, recordCount, pageCount, coverTemplateId } = publishResult
  const cover = COVER_TEMPLATES.find((t) => t.id === coverTemplateId)

  const handleHome = () => {
    clearPublishResult()
    navigate('/home')
  }

  const handleBook = () => {
    clearPublishResult()
    navigate('/project/workspace')
  }

  const handleLibrary = () => {
    clearPublishResult()
    navigate('/library')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col items-center justify-center bg-surface px-7 py-10 text-center">
      <div className="relative mb-6 flex h-[120px] w-full items-center justify-center">
        <AppLottie
          animationData={confettiAnimation}
          width={200}
          height={200}
          loop={false}
          className="pointer-events-none absolute"
        />
      </div>
      <h1 className="mb-3 font-serif text-2xl font-bold">당신의 이야기가 책이 되었어요.</h1>
      <p className="mb-8 text-sm leading-relaxed text-ink-muted">
        <strong className="text-ink">{project.title}</strong>
        <br />
        오늘까지 쌓아온 기록이 한 권의 책으로 완성됐어요.
      </p>

      <Card className="mb-8 w-full p-4 text-left">
        <div className="flex items-center gap-4">
          <div
            className={[
              'flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-md text-center',
              cover?.bgClass ?? 'bg-ink',
              cover?.textClass ?? 'text-white',
            ].join(' ')}
          >
            {cover?.emoji && <span className="text-lg">{cover.emoji}</span>}
          </div>
          <div className="text-sm">
            <p className="font-semibold">{project.title}</p>
            <p className="mt-1 text-xs text-ink-muted">
              기록 {recordCount}개 · 약 {pageCount}페이지
            </p>
            <p className="mt-1 text-xs text-ink-muted">표지: {cover?.name ?? coverTemplateId}</p>
          </div>
        </div>
      </Card>

      <Button className="mb-2" onClick={handleBook}>완성된 책 열기</Button>
      <Button variant="secondary" className="mb-2" onClick={handleLibrary}>내 서재에서 보기</Button>
      <Button variant="ghost" onClick={handleHome}>홈으로</Button>
    </div>
  )
}
