import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, FlatIcon } from '@/components/common'
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

  const handleWorkspace = () => {
    clearPublishResult()
    navigate('/project/workspace')
  }

  const handleLibrary = () => {
    clearPublishResult()
    navigate('/library')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface px-6 pb-8 pt-8">
      <header className="flex items-center justify-between border-b border-ink pb-5">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">PUBLISHED</p>
        <FlatIcon name="book" size={24} className="text-sage" />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <div
          className={[
            'flex aspect-[3/4] w-36 flex-col justify-between rounded-r-md rounded-l-[3px] p-5 shadow-[10px_12px_0_rgba(59,53,45,.12)]',
            cover?.bgClass ?? 'bg-ink',
            cover?.textClass ?? 'text-white',
          ].join(' ')}
        >
          <span className="text-[7px] tracking-[0.18em] opacity-55">MY CHAPTER</span>
          <div>
            <span className={['mx-auto mb-5 block h-px w-10', cover?.accentClass ?? 'bg-sage'].join(' ')} />
            <p className="font-serif text-base font-bold leading-snug">{project.title}</p>
          </div>
          <span className="text-[7px] opacity-50">{cover?.name ?? 'MY CHAPTER'}</span>
        </div>

        <p className="mt-9 text-[10px] font-semibold tracking-[0.2em] text-sage">YOUR BOOK IS READY</p>
        <h1 className="mt-3 font-serif text-[28px] font-bold leading-snug tracking-[-0.03em]">
          당신의 이야기가
          <br />
          한 권이 되었어요.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          기록 {recordCount}개가 약 {pageCount}페이지의 책으로 정리됐어요.
          <br />
          이 발행본은 완성한 책에서 다시 열 수 있어요.
        </p>

        <div className="mt-8 w-full border-y border-border py-4 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-muted">책 제목</span><span className="max-w-[220px] truncate font-semibold">{project.title}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-ink-muted">표지</span><span className="font-semibold">{cover?.name ?? coverTemplateId}</span>
          </div>
        </div>
      </main>

      <div>
        <Button className="mb-2" onClick={handleLibrary}>내 서재에서 보기</Button>
        <Button variant="secondary" className="mb-2" onClick={handleWorkspace}>책 작업실로 돌아가기</Button>
        <Button variant="ghost" onClick={handleHome}>홈으로</Button>
      </div>
    </div>
  )
}
