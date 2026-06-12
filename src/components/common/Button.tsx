import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white font-semibold hover:opacity-95',
  secondary: 'border-[1.5px] border-border-strong text-ink font-medium bg-white',
  ghost: 'text-ink-muted font-medium',
  danger: 'bg-danger text-white font-semibold',
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
        'rounded-btn px-5 py-[15px] text-[15px] transition-opacity disabled:opacity-40',
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
