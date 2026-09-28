import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLottie, Button, Card } from '@/components/common'
import bookOpenAnimation from '@/assets/animations/book-open.json'
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
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col items-center justify-center bg-surface px-7 py-10 text-center">
      <AppLottie animationData={bookOpenAnimation} width={100} height={80} loop={false} className="mb-6" />
      <p className="text-xs font-semibold tracking-[0.18em] text-sage">NEW BOOK</p>
      <h1 className="mt-2 font-serif text-2xl font-bold">첫 페이지가 준비됐어요.</h1>
      <p className="mb-8 mt-3 text-sm leading-relaxed text-ink-muted">
        <strong className="text-ink">{createdProject.title}</strong>
        <br />
        오늘부터 기록을 차곡차곡 모아
        <br />
        한 권의 이야기로 만들어가요.
      </p>

      <Card className="mb-8 w-full p-4 text-left">
        <p className="text-sm font-semibold">첫 기록 방식은 매번 선택할 수 있어요.</p>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          PAGE의 AI 질문으로 시작해도 되고, 오늘 떠오르는 이야기를 자유롭게 적어도 괜찮아요.
        </p>
      </Card>

      <Button className="mb-2" onClick={handleWrite}>첫 기록 방식 선택하기</Button>
      <Button variant="ghost" onClick={handleHome}>홈으로</Button>
    </div>
  )
}
