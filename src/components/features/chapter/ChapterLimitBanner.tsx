import { Button, Card } from '@/components/common'

interface ChapterLimitBannerProps {
  onUpgrade: () => void
  className?: string
}

export function ChapterLimitBanner({ onUpgrade, className }: ChapterLimitBannerProps) {
  return (
    <Card accent className={className ?? ''}>
      <p className="text-sm font-semibold">챕터 구성을 위해 Pro가 필요해요</p>
      <p className="mt-1 text-xs text-ink-muted">
        Free 플랜은 챕터 3개까지예요. Pro로 업그레이드하면 4번째 챕터부터 생성할 수 있어요.
      </p>
      <Button className="mt-3" onClick={onUpgrade}>
        Pro로 챕터 더 만들기
      </Button>
    </Card>
  )
}
