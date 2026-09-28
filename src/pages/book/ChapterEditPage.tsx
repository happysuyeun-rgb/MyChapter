import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Input, Modal, Textarea } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { getChapter, regenerateChapter, updateChapterContent } from '@/lib/api/chapters'
import type { Chapter } from '@/types/database'
import { getChapterDisplayContent } from '@/utils/chapterContent'
import { useToastStore } from '@/stores/toastStore'

export function ChapterEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToastStore()

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!id) return

    void getChapter(id).then((data) => {
      if (!data) {
        navigate('/book', { replace: true })
        return
      }
      setChapter(data)
      setTitle(data.title)
      setContent(getChapterDisplayContent(data))
    })
  }, [id, navigate])

  const handleSave = async () => {
    if (!chapter) return
    setSaving(true)
    try {
      const updated = await updateChapterContent(chapter.id, title.trim(), content.trim())
      setChapter(updated)
      navigate(`/book/chapter/${chapter.id}`, { replace: true })
    } catch {
      showToast('저장에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerate = async () => {
    if (!chapter) return
    setConfirmOpen(false)
    setRegenerating(true)
    try {
      const updated = await regenerateChapter(chapter.id)
      setChapter(updated)
      setTitle(updated.title)
      setContent(getChapterDisplayContent(updated))
    } finally {
      setRegenerating(false)
    }
  }

  if (!chapter) {
    return <div className="flex flex-1 items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <NavBar
        title="원고 편집"
        leftLabel="취소"
        rightLabel="저장"
        rightAccent
        onLeftClick={() => navigate(`/book/chapter/${chapter.id}`)}
        onRightClick={() => void handleSave()}
      />

      <main className="flex-1 overflow-y-auto px-5 pb-8 pt-7">
        <header className="border-b border-ink pb-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">
            EDITING · CHAPTER {String(chapter.chapter_number).padStart(2, '0')}
          </p>
          <div className="mt-5">
            <label className="mb-2 block text-[9px] font-semibold tracking-[0.15em] text-ink-faint">CHAPTER TITLE</label>
            <Input
              active
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={30}
              className="font-serif text-[21px] font-bold"
            />
          </div>
        </header>

        <section className="pt-7">
          <label className="mb-2 block text-[9px] font-semibold tracking-[0.15em] text-ink-faint">MANUSCRIPT</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="min-h-[460px] border-0 bg-transparent px-0 font-serif text-[16px] leading-8 focus:border-0"
          />
          <p className="border-t border-border pt-2 text-right text-[10px] text-ink-faint">{content.length}자</p>
        </section>

        <section className="mt-8 border-y border-border py-5">
          <p className="text-[9px] font-semibold tracking-[0.15em] text-sage">AI EDITOR</p>
          <p className="mt-2 text-xs leading-5 text-ink-muted">
            원본 기록을 다시 읽고 챕터 초안을 새로 만들 수 있어요. 현재 직접 수정한 내용은 교체됩니다.
          </p>
          <button
            type="button"
            disabled={regenerating || saving}
            className="mt-4 min-h-11 border-b border-ink text-sm font-semibold disabled:opacity-40"
            onClick={() => setConfirmOpen(true)}
          >
            {regenerating ? '원고를 다시 구성하고 있어요...' : 'AI로 다시 구성하기 →'}
          </button>
        </section>
      </main>

      <div className="border-t border-border bg-surface px-5 py-4 safe-bottom">
        <Button disabled={saving || regenerating || !title.trim() || !content.trim()} onClick={() => void handleSave()}>
          {saving ? '저장 중...' : '편집 내용 저장하기'}
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="원고를 다시 구성할까요?">
        <p className="mb-6 text-center text-sm leading-6 text-ink-muted">
          PAGE가 원본 기록부터 다시 읽고 새 초안을 만들어요.
          <br />
          지금 수정한 원고는 교체됩니다.
        </p>
        <Button onClick={() => void handleRegenerate()}>다시 구성하기</Button>
        <Button variant="ghost" className="mt-2" onClick={() => setConfirmOpen(false)}>취소</Button>
      </Modal>
    </div>
  )
}
