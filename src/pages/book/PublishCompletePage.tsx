import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SuccessPanel } from '@/components/common'
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

  const { project, recordCount, pageCount, coverTemplateId, publicationId, version } = publishResult
  const cover = COVER_TEMPLATES.find((t) => t.id === coverTemplateId)

  return (
    <SuccessPanel
      eyebrow="PUBLISHED"
      icon="book"
      leading={
        <div className="mb-8 flex flex-col items-center">
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
        </div>
      }
      title={
        <>
          당신의 이야기가
          <br />
          한 권이 되었어요.
        </>
      }
      description={
        <>
          기록 {recordCount}개가 약 {pageCount}페이지의 책으로 정리됐어요.
          <br />
          이 발행본은 완성한 책에서 다시 열 수 있어요.
        </>
      }
      primary={{
        label: '방금 발행한 책 열기',
        onClick: () => {
          clearPublishResult()
          navigate(`/publication/${publicationId}`)
        },
      }}
      secondary={{
        label: '책 작업실로 돌아가기',
        variant: 'secondary',
        onClick: () => {
          clearPublishResult()
          navigate('/project/workspace')
        },
      }}
      tertiary={{
        label: '홈으로',
        onClick: () => {
          clearPublishResult()
          navigate('/home')
        },
      }}
    >
      <div className="mt-8 w-full border-y border-border py-4 text-left">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-muted">책 제목</span>
          <span className="max-w-[220px] truncate font-semibold">{project.title}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-ink-muted">발행 버전</span>
          <span className="font-semibold">v{version}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-ink-muted">표지</span>
          <span className="font-semibold">{cover?.name ?? coverTemplateId}</span>
        </div>
      </div>
    </SuccessPanel>
  )
}
