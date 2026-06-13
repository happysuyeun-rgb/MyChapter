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
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <NavBar
        title="원고 편집"
        leftLabel="취소"
        rightLabel="저장"
        rightAccent
        onLeftClick={() => navigate(`/book/chapter/${chapter.id}`)}
        onRightClick={() => void handleSave()}
      />

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div>
          <label className="mb-2 block text-xs font-semibold text-ink-muted">챕터 제목</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={30} />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold text-ink-muted">본문</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="min-h-[320px] font-serif"
          />
          <p className="mt-2 text-right text-xs text-ink-faint">{content.length}자</p>
        </div>
        <Button
          variant="secondary"
          disabled={regenerating || saving}
          onClick={() => setConfirmOpen(true)}
        >
          {regenerating ? 'AI 재생성 중...' : 'AI로 다시 쓰기'}
        </Button>
        <p className="text-center text-xs text-ink-muted">
          AI 재생성 시 직접 수정한 내용이 사라져요
        </p>
      </div>

      <div className="border-t border-border px-5 py-4">
        <Button disabled={saving || regenerating || !title.trim() || !content.trim()} onClick={() => void handleSave()}>
          {saving ? '저장 중...' : '저장하기'}
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="AI로 다시 쓸까요?">
        <p className="mb-6 text-center text-sm leading-relaxed text-ink-muted">
          기록을 바탕으로 원고를 새로 생성해요.
          <br />
          직접 수정한 내용은 덮어씌워져요.
        </p>
        <Button onClick={() => void handleRegenerate()}>재생성하기</Button>
        <Button variant="ghost" className="mt-2" onClick={() => setConfirmOpen(false)}>
          취소
        </Button>
      </Modal>
    </div>
  )
}
