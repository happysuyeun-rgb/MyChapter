import { forwardRef, type TextareaHTMLAttributes } from 'react'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={[
          'w-full resize-none rounded-[14px] bg-surface-alt p-4 text-[15px] leading-relaxed text-ink outline-none',
          'focus:border-[1.5px] focus:border-accent focus:bg-white',
          className,
        ].join(' ')}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'
