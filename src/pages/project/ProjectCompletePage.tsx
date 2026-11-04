import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SuccessPanel } from '@/components/common'
import { useProjectStore } from '@/stores/projectStore'

export function ProjectCompletePage() {
  const navigate = useNavigate()
  const { createdProject, resetDraft } = useProjectStore()

  useEffect(() => {
    if (!createdProject) navigate('/project/new', { replace: true })
  }, [createdProject, navigate])

  if (!createdProject) return null

  return (
    <SuccessPanel
      eyebrow="NEW BOOK READY"
      icon="book"
      leading={
        <div className="mb-8">
          <div className="flex h-44 w-28 flex-col justify-between rounded-r-md rounded-l-[3px] bg-ink p-4 text-surface shadow-[9px_11px_0_rgba(59,53,45,.12)]">
            <span className="text-[7px] tracking-[0.18em] opacity-55">MY CHAPTER</span>
            <div>
              <span className="mb-4 block h-px w-7 bg-sage" />
              <p className="line-clamp-4 font-serif text-sm font-bold leading-[1.5]">{createdProject.title}</p>
            </div>
            <span className="text-[7px] opacity-45">BOOK 01</span>
          </div>
          <p className="mt-9 text-[10px] font-semibold tracking-[0.2em] text-sage">FIRST PAGE</p>
        </div>
      }
      title="첫 페이지를 쓸 준비가 됐어요."
      description="오늘부터 한 장면씩 모아보세요. PAGE는 기록을 서두르지 않고, 충분히 쌓였을 때 책 만들기를 열어드려요."
      primary={{
        label: '첫 페이지 쓰기',
        onClick: () => {
          resetDraft()
          navigate('/record/mode')
        },
      }}
      secondary={{
        label: '홈으로',
        onClick: () => {
          resetDraft()
          navigate('/home')
        },
      }}
    >
      <section className="mt-8 border-y border-border py-5">
        <p className="text-xs font-semibold">기록 방식은 매번 선택할 수 있어요.</p>
        <p className="mt-2 text-[11px] leading-5 text-ink-muted">
          AI 질문, 자유 기록, 사진 기록 중 오늘 가장 편한 방식을 고르면 됩니다.
        </p>
      </section>
    </SuccessPanel>
  )
}
