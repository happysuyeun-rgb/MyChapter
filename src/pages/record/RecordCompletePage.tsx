import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLottie, Button, Card, ProgressBar } from '@/components/common'
import checkmarkAnimation from '@/assets/animations/checkmark-complete.json'
import { ChapterLimitBanner } from '@/components/features/chapter/ChapterLimitBanner'
import { useSubscription } from '@/hooks/useSubscription'
import { usePaywallStore } from '@/stores/paywallStore'
import { useRecordStore } from '@/stores/recordStore'
import { getNextStreakGoal, getStreakMessage } from '@/utils/streak'

export function RecordCompletePage() {
  const navigate = useNavigate()
  const { lastSave, lastProject, clearLastSave } = useRecordStore()
  const { isPro } = useSubscription()
  const { showPaywall } = usePaywallStore()

  useEffect(() => {
    if (!lastSave || !lastProject) {
      navigate('/home', { replace: true })
    }
  }, [lastSave, lastProject, navigate])

  if (!lastSave || !lastProject) return null

  const { record, recordCount, progress, streak, badgeTitles } = lastSave
  const streakMsg = getStreakMessage(streak)
  const nextGoal = getNextStreakGoal(streak)
  const remaining = Math.max(0, lastProject.target_count - recordCount)
  const chapterLimitHit =
    !isPro && recordCount % 10 === 0 && recordCount >= 40

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col items-center justify-center bg-white px-7 py-10 text-center">
      <AppLottie
        animationData={checkmarkAnimation}
        width={80}
        height={80}
        loop={false}
        className="mb-5"
      />
      <h1 className="mb-2.5 text-lg font-bold">{record.record_number}번째 기록 완성!</h1>
      <p className="mb-7 text-sm text-ink-muted">완성까지 {remaining}개 남았어요</p>

      <Card accent className="mb-6 w-full p-[18px] text-left">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[13px] font-semibold">{lastProject.title}</span>
          <span className="text-lg font-extrabold text-accent">{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </Card>

      {chapterLimitHit && (
        <ChapterLimitBanner
          className="mb-6 w-full p-[18px] text-left"
          onUpgrade={() => showPaywall()}
        />
      )}

      {streakMsg && (
        <Card className="mb-6 flex w-full items-center gap-3 p-3.5 text-left">
          <span className="text-[32px]">🔥</span>
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
