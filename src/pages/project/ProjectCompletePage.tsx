import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, FlatIcon } from '@/components/common'
import { useProjectStore } from '@/stores/projectStore'

export function ProjectCompletePage() {
  const navigate = useNavigate()
  const { createdProject, resetDraft } = useProjectStore()

  useEffect(() => {
    if (!createdProject) navigate('/project/new', { replace: true })
  }, [createdProject, navigate])

  if (!createdProject) return null

  const handleWrite = () => {
    resetDraft()
    navigate('/record/mode')
  }

  const handleHome = () => {
    resetDraft()
    navigate('/home')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface px-6 pb-8 pt-8">
      <header className="flex items-center justify-between border-b border-ink pb-5">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">NEW BOOK READY</p>
        <FlatIcon name="book" size={24} className="text-sage" />
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <div className="flex h-44 w-28 flex-col justify-between rounded-r-md rounded-l-[3px] bg-ink p-4 text-surface shadow-[9px_11px_0_rgba(59,53,45,.12)]">
          <span className="text-[7px] tracking-[0.18em] opacity-55">MY CHAPTER</span>
          <div>
            <span className="mb-4 block h-px w-7 bg-sage" />
            <p className="line-clamp-4 font-serif text-sm font-bold leading-[1.5]">{createdProject.title}</p>
          </div>
          <span className="text-[7px] opacity-45">BOOK 01</span>
        </div>

        <p className="mt-9 text-[10px] font-semibold tracking-[0.2em] text-sage">FIRST PAGE</p>
        <h1 className="mt-3 font-serif text-[28px] font-bold leading-snug tracking-[-0.03em]">첫 페이지를 쓸 준비가 됐어요.</h1>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          오늘부터 한 장면씩 모아보세요. PAGE는 기록을 서두르지 않고, 충분히 쌓였을 때 책 만들기를 열어드려요.
        </p>

        <section className="mt-8 border-y border-border py-5">
          <p className="text-xs font-semibold">기록 방식은 매번 선택할 수 있어요.</p>
          <p className="mt-2 text-[11px] leading-5 text-ink-muted">AI 질문, 자유 기록, 사진 기록 중 오늘 가장 편한 방식을 고르면 됩니다.</p>
        </section>
      </main>

      <div>
        <Button className="mb-2" onClick={handleWrite}>첫 페이지 쓰기</Button>
        <Button variant="ghost" onClick={handleHome}>홈으로</Button>
      </div>
    </div>
  )
}
