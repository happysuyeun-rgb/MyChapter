import { Badge } from '@/components/common'

interface ModeSelectCardProps {
  emoji: string
  title: string
  description: string
  active?: boolean
  badge?: string
  onClick: () => void
}

export function ModeSelectCard({
  emoji,
  title,
  description,
  active = false,
  badge,
  onClick,
}: ModeSelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'mb-2.5 flex w-full items-center gap-3.5 rounded-card border-[1.5px] p-4 text-left transition-colors',
        active
          ? 'border-accent bg-accent-light'
          : 'border-border-strong bg-white',
      ].join(' ')}
    >
      <span className="shrink-0 text-[28px]">{emoji}</span>
      <div className="flex-1">
        <p
          className={[
            'mb-0.5 text-sm',
            active ? 'font-bold text-accent' : 'font-semibold text-ink',
          ].join(' ')}
        >
          {title}
        </p>
        <p className="text-sm text-ink-muted">{description}</p>
        {badge && (
          <Badge className="mt-1.5">{badge}</Badge>
        )}
      </div>
    </button>
  )
}
