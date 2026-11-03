import type { ReactNode } from 'react'
import type { FlatIconName } from './FlatIcon'
import { FlatIcon } from './FlatIcon'
import { Button } from './Button'

interface SuccessAction {
  label: string
  onClick: () => void
}

interface SuccessPanelProps {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  icon?: FlatIconName
  /** Optional content above the title (e.g. page number, cover) */
  leading?: ReactNode
  children?: ReactNode
  primary: SuccessAction
  secondary?: SuccessAction & { variant?: 'secondary' | 'ghost' }
  tertiary?: SuccessAction
  className?: string
}

/**
 * Shared success / next-step panel. Navigation handlers stay in the page.
 */
export function SuccessPanel({
  eyebrow,
  title,
  description,
  icon = 'check',
  leading,
  children,
  primary,
  secondary,
  tertiary,
  className = '',
}: SuccessPanelProps) {
  return (
    <div
      className={[
        'desk-fade-in mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface px-6 pb-8 pt-8',
        className,
      ].join(' ')}
    >
      <header className="desk-rule flex items-center justify-between pb-5">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">{eyebrow}</p>
        <FlatIcon name={icon} size={24} className="text-sage" />
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        {leading}
        <h1 className="font-serif text-[28px] font-bold leading-snug tracking-[-0.03em] text-ink">
          {title}
        </h1>
        {description && (
          <div className="mt-4 text-sm leading-6 text-ink-muted">{description}</div>
        )}
        {children}
      </main>

      <div>
        <Button className="mb-2" onClick={primary.onClick}>
          {primary.label}
        </Button>
        {secondary && (
          <Button
            variant={secondary.variant ?? 'ghost'}
            className="mb-2"
            onClick={secondary.onClick}
          >
            {secondary.label}
          </Button>
        )}
        {tertiary && (
          <Button variant="ghost" onClick={tertiary.onClick}>
            {tertiary.label}
          </Button>
        )}
      </div>
    </div>
  )
}
