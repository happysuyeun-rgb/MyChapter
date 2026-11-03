import { ProgressBar } from './ProgressBar'

interface DeskProgressProps {
  score: number
  message: string
  recordCount: number
  /** Dark ink panel (home hero) vs paper surface */
  tone?: 'ink' | 'paper'
  className?: string
}

/**
 * Story readiness summary. Callers compute readiness; this is presentation only.
 */
export function DeskProgress({
  score,
  message,
  recordCount,
  tone = 'ink',
  className = '',
}: DeskProgressProps) {
  const isInk = tone === 'ink'
  const empty = recordCount === 0

  return (
    <div className={className}>
      <div className="flex items-end justify-between">
        <span className={['text-[11px]', isInk ? 'text-surface/55' : 'text-ink-faint'].join(' ')}>
          이야기 준비도
        </span>
        <span
          className={[
            'font-serif text-3xl font-bold',
            isInk ? 'text-surface' : 'text-ink',
          ].join(' ')}
        >
          {empty ? '첫 장' : `${score}%`}
        </span>
      </div>
      {!empty && (
        <ProgressBar
          value={score}
          className={['mt-2', isInk ? 'bg-surface/15 [&>div]:bg-sage' : '[&>div]:bg-sage'].join(' ')}
        />
      )}
      <p
        className={[
          'mt-2 text-[11px] leading-5',
          isInk ? 'text-surface/55' : 'text-ink-muted',
        ].join(' ')}
      >
        {empty ? '첫 기록을 남기면 책이 시작됩니다.' : message}
      </p>
    </div>
  )
}
