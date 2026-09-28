import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'border border-ink bg-ink text-surface font-semibold hover:opacity-95',
  secondary: 'border border-border-strong bg-surface text-ink font-medium',
  ghost: 'border border-transparent bg-transparent text-ink-muted font-medium',
  danger: 'border border-danger bg-danger text-white font-semibold',
}

export function Button({
  variant = 'primary',
  fullWidth = true,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'min-h-[48px] px-5 py-3.5 text-[14px] transition-[opacity,transform] active:translate-y-px disabled:opacity-40',
        fullWidth ? 'w-full' : '',
        variants[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
