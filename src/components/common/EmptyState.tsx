import { useNavigate } from 'react-router-dom'
import type { FlatIconName } from './FlatIcon'
import { FlatIcon } from './FlatIcon'
import { Button } from './Button'

type EmptyVariant = 'home' | 'records' | 'book'

interface EmptyStateProps {
  variant: EmptyVariant
}

const config: Record<
  EmptyVariant,
  { icon: FlatIconName; title: string; description: string; cta: string; to: string }
> = {
  home: {
    icon: 'book',
    title: '아직 프로젝트가 없어요',
    description: '첫 번째 책 프로젝트를 시작해보세요.\nAI가 루틴을 설계해드릴게요.',
    cta: '첫 프로젝트 시작하기',
    to: '/project/new',
  },
  records: {
    icon: 'pen',
    title: '아직 기록이 없어요',
    description: '오늘의 첫 기록을 남겨보세요.',
    cta: '첫 기록 쓰기',
    to: '/record/mode',
  },
  book: {
    icon: 'books',
    title: '완성한 책이 아직 없어요',
    description: '기록을 쌓아 나만의 책을 완성해보세요.',
    cta: '홈으로',
    to: '/home',
  },
}

export function EmptyState({ variant }: EmptyStateProps) {
  const navigate = useNavigate()
  const { icon, title, description, cta, to } = config[variant]

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
      <div
        className="mb-6 flex size-[72px] items-center justify-center rounded-full bg-surface-alt text-accent"
        aria-hidden
      >
        <FlatIcon name={icon} size={30} />
      </div>
      <h2 className="mb-2.5 font-serif text-xl font-bold text-ink">{title}</h2>
      <p className="mb-9 max-w-[260px] whitespace-pre-line text-sm leading-relaxed text-ink-muted">
        {description}
      </p>
      <Button onClick={() => navigate(to)}>{cta}</Button>
    </div>
  )
}
