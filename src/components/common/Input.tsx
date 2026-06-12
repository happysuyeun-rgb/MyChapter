import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  active?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ active = false, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={[
          'w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-colors',
          active
            ? 'border-[1.5px] border-accent bg-white text-ink'
            : 'bg-surface-alt text-ink-muted',
          className,
        ].join(' ')}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'
