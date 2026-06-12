interface ProgressBarProps {
  value: number
  className?: string
}

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={`h-2 overflow-hidden rounded-md bg-surface-alt ${className}`}>
      <div
        className="h-full rounded-md bg-accent transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
