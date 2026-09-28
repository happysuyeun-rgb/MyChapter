import { useNavigate } from 'react-router-dom'

interface NavBarProps {
  title?: string
  leftLabel?: string
  rightLabel?: string
  onLeftClick?: () => void
  onRightClick?: () => void
  rightAccent?: boolean
}

export function NavBar({
  title = '',
  leftLabel,
  rightLabel,
  onLeftClick,
  onRightClick,
  rightAccent = false,
}: NavBarProps) {
  const navigate = useNavigate()

  return (
    <header className="flex min-h-[56px] shrink-0 items-center gap-3 border-b border-border bg-surface px-5">
      <button
        type="button"
        className="min-h-11 min-w-12 text-left text-[12px] font-medium text-ink-muted"
        onClick={onLeftClick ?? (() => navigate(-1))}
      >
        {leftLabel ?? ''}
      </button>
      <h1 className="flex-1 text-center font-serif text-[15px] font-bold tracking-[-0.01em]">{title}</h1>
      <button
        type="button"
        className={[
          'min-h-11 min-w-12 text-right text-[12px] font-medium',
          rightAccent ? 'font-bold text-terracotta' : 'text-ink-muted',
        ].join(' ')}
        onClick={onRightClick}
      >
        {rightLabel ?? ''}
      </button>
    </header>
  )
}
