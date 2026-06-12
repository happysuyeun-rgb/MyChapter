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
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  const content = getChapterDisplayContent(chapter)
  const paragraphs = content.split('\n\n').filter(Boolean)

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <NavBar
        title={`Chapter ${chapter.chapter_number}`}
        leftLabel="‹ 뒤로"
        rightLabel="편집"
        onRightClick={() => navigate(`/book/chapter/${chapter.id}/edit`)}
      />

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <p className="mb-2 text-xs tracking-widest text-ink-faint">
          CHAPTER {chapter.chapter_number}
        </p>
        <h1 className="mb-8 font-serif text-2xl font-semibold leading-snug text-ink">
          {chapter.title}
        </h1>
        <div className="space-y-5 font-serif text-[16px] leading-[2] text-ink">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="border-t border-border px-5 py-4">
        <Button onClick={() => navigate(`/book/chapter/${chapter.id}/edit`)}>
          원고 편집하기
        </Button>
      </div>
    </div>
  )
}
