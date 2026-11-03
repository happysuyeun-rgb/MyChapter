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
        'desk-fade-in flex flex-1 flex-col justify-center px-8 py-12',
        className,
      ].join(' ')}
    >
      <div className="desk-rule border-t border-ink py-8 text-left">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-terracotta">NOTICE</p>
          <FlatIcon name="alert" size={28} className="text-ink-muted" />
        </div>
        <h2 className="mt-5 font-serif text-lg font-bold text-ink">{title}</h2>
        <p className="mt-3 max-w-[280px] text-sm leading-6 text-ink-muted">{description}</p>
      </div>
      {onRetry && (
        <Button className="mt-7" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
