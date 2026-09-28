import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { getChapter } from '@/lib/api/chapters'
import type { Chapter } from '@/types/database'
import { getChapterDisplayContent } from '@/utils/chapterContent'

export function ChapterPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [chapter, setChapter] = useState<Chapter | null>(null)

  useEffect(() => {
    if (!id) return

    void getChapter(id).then((data) => {
      if (!data) {
        navigate('/book', { replace: true })
        return
      }
      setChapter(data)
    })
  }, [id, navigate])

  if (!chapter) {
    return <div className="flex flex-1 items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>
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
