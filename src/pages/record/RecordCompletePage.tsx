import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, FlatIcon } from '@/components/common'
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
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface px-6 pb-8 pt-8">
      <header className="flex items-center justify-between border-b border-ink pb-5">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">PAGE SAVED</p>
        <FlatIcon name="check" size={24} className="text-sage" />
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <p className="font-serif text-[56px] font-bold leading-none text-ink/10">
          {String(record.record_number).padStart(2, '0')}
        </p>
        <h1 className="-mt-2 font-serif text-[28px] font-bold leading-snug tracking-[-0.03em]">
          오늘 이야기도
          <br />
          한 페이지가 되었어요.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          {readiness.isReady
            ? '이제 한 권의 이야기를 만들 준비가 되었어요.'
            : readiness.recordsRemaining > 0 || readiness.daysRemaining > 0
              ? `책 만들기까지 ${readiness.recordsRemaining > 0 ? `기록 ${readiness.recordsRemaining}개` : ''}${readiness.recordsRemaining > 0 && readiness.daysRemaining > 0 ? ' · ' : ''}${readiness.daysRemaining > 0 ? `${readiness.daysRemaining}일` : ''}`
              : readiness.message}
        </p>

        <section className="mt-8 border-y border-border py-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-semibold tracking-[0.16em] text-sage">STORY READINESS</p>
              <p className="mt-1 text-xs text-ink-muted">{lastProject.title}</p>
            </div>
            <span className="font-serif text-[30px] font-bold">{readiness.score}%</span>
          </div>
          <div className="mt-3 h-px bg-border">
            <div className="h-px bg-ink" style={{ width: `${readiness.score}%` }} />
          </div>
          <p className="mt-3 text-[10px] text-ink-faint">기록 {recordCount}개 · {readiness.elapsedDays}일째</p>
        </section>

        {(streakMsg || badgeTitles.length > 0) && (
          <section className="mt-6 border-l-2 border-sage pl-4">
            {streakMsg && (
              <>
                <p className="text-xs font-semibold">{streakMsg}</p>
                {nextGoal && <p className="mt-1 text-[11px] text-ink-muted">{nextGoal}</p>}
              </>
            )}
            {badgeTitles.length > 0 && (
              <p className="mt-3 text-[11px] text-terracotta">{badgeTitles.join(' · ')}</p>
            )}
          </section>
        )}
      </main>

      <div>
        {readiness.isReady && (
          <Button
            className="mb-2"
            onClick={() => {
              clearLastSave()
              navigate('/project/workspace')
            }}
          >
            책 작업실 열기
          </Button>
        )}
        <Button
          variant={readiness.isReady ? 'ghost' : 'primary'}
          onClick={() => {
            clearLastSave()
            navigate('/home')
          }}
        >
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  )
}
