import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean
}

export function Card({ accent = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-card overflow-hidden',
        accent
          ? 'border-[1.5px] border-accent bg-accent-light'
          : 'border border-border bg-surface-card',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
