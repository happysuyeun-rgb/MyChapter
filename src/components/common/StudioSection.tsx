import type { ReactNode } from 'react'
import { FlatIcon } from './FlatIcon'

interface StudioSectionProps {
  eyebrow?: string
  title: string
  meta?: ReactNode
  locked?: boolean
  lockReason?: string
  children?: ReactNode
  className?: string
}

/**
 * Book workspace section chrome. Lock state is presentational — callers decide `locked`.
 */
export function StudioSection({
  eyebrow,
  title,
  meta,
  locked = false,
  lockReason,
  children,
  className = '',
}: StudioSectionProps) {
  return (
    <section className={['mt-8 first:mt-0', className].filter(Boolean).join(' ')}>
      <div className="desk-rule mb-4 flex items-end justify-between gap-3 pb-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-semibold tracking-[0.16em] text-sage">{eyebrow}</p>
          )}
          <h2 className="mt-1 font-serif text-base font-bold text-ink">{title}</h2>
        </div>
        {meta && <div className="shrink-0 text-xs text-ink-faint">{meta}</div>}
      </div>

      {locked && lockReason && (
        <div className="mb-4 flex items-start gap-2 border border-border bg-surface-alt/60 px-3 py-3">
          <FlatIcon name="lock" size={16} className="mt-0.5 shrink-0 text-ink-muted" />
          <p className="text-[12px] leading-5 text-ink-muted">{lockReason}</p>
        </div>
      )}

      {children}
    </section>
  )
}
