import { forwardRef, type TextareaHTMLAttributes } from 'react'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={[
          'w-full resize-none border border-border bg-surface-card p-4 text-[15px] leading-relaxed text-ink outline-none',
          'focus:border-ink',
          className,
        ].join(' ')}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'
