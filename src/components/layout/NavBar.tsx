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
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border px-5">
      <button
        type="button"
        className="min-w-10 text-left text-[13px] font-medium text-accent"
        onClick={onLeftClick ?? (() => navigate(-1))}
      >
        {leftLabel ?? ''}
      </button>
      <h1 className="flex-1 text-center text-base font-semibold">{title}</h1>
      <button
        type="button"
        className={[
          'min-w-10 text-right text-[13px] font-medium',
          rightAccent ? 'font-bold text-accent' : 'text-accent',
        ].join(' ')}
        onClick={onRightClick}
      >
        {rightLabel ?? ''}
      </button>
    </header>
  )
}
