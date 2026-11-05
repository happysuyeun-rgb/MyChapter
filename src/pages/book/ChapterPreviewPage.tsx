import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ErrorState, LoadingBlock } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { getChapter } from '@/lib/api/chapters'
import { useAuthStore } from '@/stores/authStore'
import type { Chapter } from '@/types/database'
import { getChapterDisplayContent } from '@/utils/chapterContent'

export function ChapterPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!id || !user) return
    let cancelled = false
    setLoadError(false)

    getChapter(id, user.id)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          navigate('/book', { replace: true })
          return
        }
        setChapter(data)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => { cancelled = true }
  }, [id, user, navigate, retryKey])

  if (loadError) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <NavBar title="원고" leftLabel="←" />
        <ErrorState title="원고를 불러오지 못했어요" onRetry={() => setRetryKey((k) => k + 1)} />
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <LoadingBlock label="원고를 불러오는 중..." />
      </div>
    )
  }

  const content = getChapterDisplayContent(chapter)
  const paragraphs = content.split('\n\n').filter(Boolean)

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <NavBar
        title={`CHAPTER ${String(chapter.chapter_number).padStart(2, '0')}`}
        leftLabel="←"
        rightLabel="편집"
        onRightClick={() => navigate(`/book/chapter/${chapter.id}/edit`)}
      />

      <main className="flex-1 overflow-y-auto px-5 pb-10 pt-7">
        <header className="border-b border-ink pb-7">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">MANUSCRIPT</p>
          <h1 className="mt-4 font-serif text-[29px] font-bold leading-snug tracking-[-0.035em] text-ink">
            {chapter.title}
          </h1>
        </header>

        <article className="py-8 font-serif text-[16px] leading-8 text-ink">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className={index === 0 ? '' : 'mt-6'}>{paragraph}</p>
          ))}
        </article>

        <div className="border-y border-border py-4 text-[10px] tracking-[0.13em] text-ink-faint">
          END OF CHAPTER {String(chapter.chapter_number).padStart(2, '0')}
        </div>
      </main>

      <div className="border-t border-border bg-surface px-5 py-4 safe-bottom">
        <Button onClick={() => navigate(`/book/chapter/${chapter.id}/edit`)}>원고 편집하기</Button>
      </div>
    </div>
  )
}
