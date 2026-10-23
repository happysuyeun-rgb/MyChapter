interface LoadingBlockProps {
  label?: string
  className?: string
}

export function LoadingBlock({
  label = '불러오는 중...',
  className = '',
}: LoadingBlockProps) {
  return (
    <div
      className={[
        'flex flex-1 flex-col items-center justify-center gap-4 px-8 py-12',
        className,
      ].join(' ')}
    >
      <div className="flex w-full max-w-[220px] flex-col gap-2.5" aria-hidden>
        <div className="h-3 animate-pulse rounded-full bg-surface-alt" />
        <div className="h-3 w-[80%] animate-pulse rounded-full bg-surface-alt" />
        <div className="h-3 w-[60%] animate-pulse rounded-full bg-surface-alt" />
        <div className="mt-2 h-20 animate-pulse rounded-card bg-surface-alt" />
      </div>
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  )
}
