import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandMasthead } from './BrandMasthead'

interface NavBarProps {
  title?: string
  leftLabel?: string
  rightLabel?: string
  onLeftClick?: () => void
  onRightClick?: () => void
  rightAccent?: boolean
  rightSlot?: ReactNode
}

export function NavBar({
  title = '',
  leftLabel,
  rightLabel,
  onLeftClick,
  onRightClick,
  rightAccent = false,
  rightSlot,
}: NavBarProps) {
  const navigate = useNavigate()

  const right =
    rightSlot ??
    (rightLabel ? (
      <button
        type="button"
        className={[
          'min-h-11 min-w-12 text-right text-[12px] font-medium',
          rightAccent ? 'font-bold text-terracotta' : 'text-ink-muted',
        ].join(' ')}
        onClick={onRightClick}
      >
        {rightLabel}
      </button>
    ) : undefined)

  return (
    <header className="shrink-0 border-b border-border bg-surface px-5 pb-3 pt-5">
      <BrandMasthead
        left={
          leftLabel !== undefined ? (
            <button
              type="button"
              className="flex min-h-11 min-w-8 items-center text-[12px] font-medium text-ink-muted"
              onClick={onLeftClick ?? (() => navigate(-1))}
              aria-label="뒤로"
            >
              {leftLabel || '←'}
            </button>
          ) : undefined
        }
        right={right}
      />
      {title ? (
        <h1 className="mt-3 font-serif text-[20px] font-bold tracking-[-0.02em] text-ink">{title}</h1>
      ) : null}
    </header>
  )
}
