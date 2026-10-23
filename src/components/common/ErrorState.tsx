import { Button } from './Button'
import { FlatIcon } from './FlatIcon'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = '잠시 문제가 생겼어요',
  description = '네트워크 상태를 확인한 뒤 다시 시도해주세요.',
  onRetry,
  retryLabel = '다시 시도',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={[
        'flex flex-1 flex-col items-center justify-center px-8 py-12 text-center',
        className,
      ].join(' ')}
    >
      <div className="mb-5 flex size-[72px] items-center justify-center rounded-full bg-surface-alt text-ink-muted">
        <FlatIcon name="alert" size={28} />
      </div>
      <h2 className="mb-2 font-serif text-lg font-bold text-ink">{title}</h2>
      <p className="mb-8 max-w-[260px] text-sm leading-relaxed text-ink-muted">
        {description}
      </p>
      {onRetry && <Button onClick={onRetry}>{retryLabel}</Button>}
    </div>
  )
}
