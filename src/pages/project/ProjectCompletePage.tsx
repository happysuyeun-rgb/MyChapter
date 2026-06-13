import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLottie, Button, Card } from '@/components/common'
import bookOpenAnimation from '@/assets/animations/book-open.json'
import { ApiError, generateQuestion } from '@/lib/api/questions'
import { usePaywallStore } from '@/stores/paywallStore'
import { useProjectStore } from '@/stores/projectStore'
import { formatDateKo } from '@/utils/calculateRoutine'

export function ProjectCompletePage() {
  const navigate = useNavigate()
  const { showPaywall } = usePaywallStore()
  const { createdProject, firstQuestion, setFirstQuestion, resetDraft } = useProjectStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!createdProject) {
      navigate('/project/new', { replace: true })
      return
    }

    const loadQuestion = async () => {
      try {
        const question = await generateQuestion(createdProject.id)
        setFirstQuestion(question)
      } catch (err) {
        if (err instanceof ApiError && err.code === 'AI_LIMIT') {
          showPaywall()
        }
      } finally {
        setLoading(false)
      }
    }

    if (!firstQuestion) {
      void loadQuestion()
    } else {
      setLoading(false)
    }
  }, [createdProject, firstQuestion, navigate, setFirstQuestion, showPaywall])

  if (!createdProject) return null

  const targetDate = createdProject.target_date
    ? formatDateKo(new Date(createdProject.target_date))
    : ''

  const handleWrite = () => {
    resetDraft()
    navigate('/record/write/question')
  }

  const handleHome = () => {
    resetDraft()
    navigate('/home')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col items-center justify-center bg-white px-7 py-10 text-center">
      <AppLottie
        animationData={bookOpenAnimation}
        width={100}
        height={80}
        loop={false}
        className="mb-6"
      />
      <h1 className="mb-3 text-lg font-bold">프로젝트가 시작됐어요!</h1>
      <p className="mb-8 text-sm leading-relaxed text-ink-muted">
        <strong className="text-ink">{createdProject.title}</strong>
        <br />
        {targetDate}까지 {createdProject.target_count}개의 기록으로
        <br />
        당신의 첫 책이 완성돼요.
      </p>

      <Card accent className="mb-8 w-full p-4 text-left">
        <p className="mb-2 text-[13px] font-bold text-accent">첫 번째 AI 질문</p>
        {loading ? (
          <p className="text-sm text-ink-muted">질문을 생성하고 있어요...</p>
        ) : (
          <p className="text-sm leading-relaxed text-ink">
            &quot;{firstQuestion ?? '오늘 하루 중 가장 기억에 남는 순간은 무엇인가요?'}&quot;
          </p>
        )}
      </Card>

      <Button className="mb-2" disabled={loading} onClick={handleWrite}>
        지금 첫 기록 쓰기
      </Button>
      <Button variant="ghost" onClick={handleHome}>
        홈으로
      </Button>
    </div>
  )
}
