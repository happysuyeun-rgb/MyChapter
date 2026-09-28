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
          'w-full border-0 border-b bg-transparent px-0 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint',
          active ? 'border-ink' : 'border-border',
          'focus:border-ink',
          className,
        ].join(' ')}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'
