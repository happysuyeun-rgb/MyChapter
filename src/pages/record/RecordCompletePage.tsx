import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLottie, Button, Card, ProgressBar } from '@/components/common'
import checkmarkAnimation from '@/assets/animations/checkmark-complete.json'
import { useRecordStore } from '@/stores/recordStore'
import { getBookReadiness } from '@/utils/bookReadiness'
import { getNextStreakGoal, getStreakMessage } from '@/utils/streak'

export function RecordCompletePage() {
  const navigate = useNavigate()
  const { lastSave, lastProject, clearLastSave } = useRecordStore()

  useEffect(() => {
    if (!lastSave || !lastProject) {
      navigate('/home', { replace: true })
    }
  }, [lastSave, lastProject, navigate])

  if (!lastSave || !lastProject) return null

  const { record, recordCount, streak, badgeTitles } = lastSave
  const readiness = getBookReadiness(lastProject, recordCount)
  const streakMsg = getStreakMessage(streak)
  const nextGoal = getNextStreakGoal(streak)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col items-center justify-center bg-surface px-7 py-10 text-center">
      <AppLottie
        animationData={checkmarkAnimation}
        width={80}
        height={80}
        loop={false}
        className="mb-5"
      />
      <h1 className="mb-2.5 font-serif text-xl font-bold">{record.record_number}번째 페이지가 쌓였어요.</h1>
      <p className="mb-7 text-sm leading-relaxed text-ink-muted">
        {readiness.isReady
          ? '이제 한 권의 이야기를 만들 준비가 되었어요.'
          : readiness.recordsRemaining > 0 || readiness.daysRemaining > 0
            ? `책 만들기까지 ${readiness.recordsRemaining > 0 ? `기록 ${readiness.recordsRemaining}개` : ''}${readiness.recordsRemaining > 0 && readiness.daysRemaining > 0 ? ' · ' : ''}${readiness.daysRemaining > 0 ? `${readiness.daysRemaining}일` : ''}`
            : readiness.message}
      </p>

      <section className="mb-6 w-full border-y border-border py-5 text-left">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[13px] font-semibold">{lastProject.title}</span>
          <span className="font-serif text-lg font-bold text-accent">{readiness.score}%</span>
        </div>
        <ProgressBar value={readiness.score} />
        <p className="mt-2 text-[11px] text-ink-muted">이야기 준비도 · 기록 {recordCount}개 · {readiness.elapsedDays}일째</p>
      </section>

      {readiness.isReady && (
        <Button
          className="mb-4"
          onClick={() => {
            clearLastSave()
            navigate('/project/workspace')
          }}
        >
          책 만들기 시작하기
        </Button>
      )}

      {streakMsg && (
        <Card className="mb-6 flex w-full items-center gap-3 p-3.5 text-left">
          <span className="text-[28px]" aria-hidden>●</span>
          <div>
            <p className="text-[13px] font-bold">{streakMsg}</p>
            {nextGoal && <p className="text-sm text-ink-muted">{nextGoal}</p>}
          </div>
        </Card>
      )}

      {badgeTitles.map((title) => (
        <Card key={title} className="mb-3 w-full p-3 text-sm font-semibold">
          {title}
        </Card>
      ))}

      <Button
        variant="ghost"
        onClick={() => {
          clearLastSave()
          navigate('/home')
        }}
      >
        홈으로 돌아가기
      </Button>
    </div>
  )
}
