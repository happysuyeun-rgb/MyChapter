import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'accent' | 'gray' | 'orange'
}

const variants = {
  accent: 'bg-accent-light text-accent',
  gray: 'bg-surface-alt text-ink-muted',
  orange: 'bg-[#FFF3E0] text-[#E65100]',
}

export function Badge({ variant = 'accent', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}
