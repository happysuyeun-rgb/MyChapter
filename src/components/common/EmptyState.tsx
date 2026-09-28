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
  { icon: FlatIconName; eyebrow: string; title: string; description: string; cta: string; to: string }
> = {
  home: {
    icon: 'book',
    eyebrow: 'FIRST BOOK',
    title: '아직 펼쳐진 책이 없어요',
    description: '오늘 한 페이지를 남기면\n당신의 첫 번째 책이 시작됩니다.',
    cta: '첫 번째 책 시작하기',
    to: '/project/new',
  },
  records: {
    icon: 'pen',
    eyebrow: 'FIRST PAGE',
    title: '아직 기록한 페이지가 없어요',
    description: '잘 쓰는 것보다 남기는 것이 먼저예요.\n오늘의 장면 하나부터 시작해보세요.',
    cta: '첫 페이지 쓰기',
    to: '/record/mode',
  },
  book: {
    icon: 'books',
    eyebrow: 'PUBLISHED BOOKS',
    title: '아직 완성한 책이 없어요',
    description: '기록이 충분히 쌓이면 PAGE와 함께\n챕터와 원고를 한 권으로 엮을 수 있어요.',
    cta: '홈으로 돌아가기',
    to: '/home',
  },
}

export function EmptyState({ variant }: EmptyStateProps) {
  const navigate = useNavigate()
  const { icon, eyebrow, title, description, cta, to } = config[variant]

  return (
    <div className="flex flex-1 flex-col justify-center px-8 py-14">
      <div className="border-y border-ink py-8 text-left">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">{eyebrow}</p>
          <FlatIcon name={icon} size={28} className="text-sage" />
        </div>
        <h2 className="mt-5 font-serif text-[24px] font-bold leading-snug tracking-[-0.03em] text-ink">{title}</h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-ink-muted">{description}</p>
      </div>
      <Button className="mt-7" onClick={() => navigate(to)}>{cta}</Button>
    </div>
  )
}
