import type { ButtonHTMLAttributes } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Chip({ active = false, className = '', children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={[
        'm-1 inline-flex rounded-full px-3.5 py-1.5 text-[13px] transition-colors',
        active
          ? 'bg-accent font-semibold text-white'
          : 'bg-surface-alt text-ink-muted',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
