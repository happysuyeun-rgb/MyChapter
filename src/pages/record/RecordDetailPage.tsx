import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Modal } from '@/components/common'
import { RecordActionSheet } from '@/components/features/record/RecordActionSheet'
import { NavBar } from '@/components/layout/NavBar'
import { deleteRecord, getPhotoSignedUrl, getRecord } from '@/lib/api/records'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useRecordStore } from '@/stores/recordStore'
import type { Chapter, JournalRecord } from '@/types/database'

const MODE_LABEL: Record<string, string> = {
  question: 'AI QUESTION',
  photo: 'PHOTO NOTE',
  free: 'FREE WRITING',
}

export function RecordDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setEditingRecord } = useRecordStore()

  const [record, setRecord] = useState<JournalRecord | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      const data = await getRecord(id)
      if (!data) {
        navigate('/records', { replace: true })
        return
      }
      setRecord(data)

      if (data.photo_url) {
        const url = await getPhotoSignedUrl(data.photo_url)
        setPhotoUrl(url)
      }

      if (data.chapter_id) {
        const { data: ch } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', data.chapter_id)
          .maybeSingle()
        setChapter(ch)
      }
    }

    void load()
  }, [id, navigate])

  const handleDelete = async () => {
    if (!record || !user) return
    setDeleting(true)
    await deleteRecord(record.id, user.id)
    setDeleting(false)
    navigate('/records', { replace: true })
  }

  const handleEdit = () => {
    if (!record) return
    setEditingRecord(record)
    const routes = {
      question: '/record/write/question',
      photo: '/record/write/photo',
      free: '/record/write/free',
    }
    navigate(routes[record.mode])
  }

  if (!record) {
    return <div className="flex min-h-dvh items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>
  }

  const dateLabel = new Date(record.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar
        title={`PAGE ${String(record.record_number).padStart(2, '0')}`}
        leftLabel="←"
        rightLabel="···"
        onRightClick={() => setSheetOpen(true)}
      />

      <main className="flex-1 overflow-y-auto px-5 pb-10 pt-7">
        <header className="border-b border-ink pb-6">
          <p className="text-[9px] font-semibold tracking-[0.16em] text-sage">{MODE_LABEL[record.mode]}</p>
          <p className="mt-2 text-[11px] text-ink-faint">{dateLabel}</p>

          {record.mode === 'question' && record.question_text && (
            <div className="mt-6 border-l-2 border-sage pl-4">
              <p className="text-[9px] font-semibold tracking-[0.15em] text-sage">PAGE'S QUESTION</p>
              <p className="mt-2 font-serif text-[16px] font-semibold leading-7">{record.question_text}</p>
            </div>
          )}

          {record.mode === 'free' && record.title && (
            <h1 className="mt-6 font-serif text-[25px] font-bold leading-snug tracking-[-0.03em]">{record.title}</h1>
          )}
        </header>

        {photoUrl && (
          <figure className="border-b border-border py-6">
            <img src={photoUrl} alt="기록 사진" className="w-full object-cover" />
          </figure>
        )}

        <article className="whitespace-pre-wrap border-b border-border py-7 font-serif text-[16px] leading-8 text-ink">
          {record.content}
        </article>

        {record.emotion_tags.length > 0 && (
          <section className="border-b border-border py-5">
            <p className="text-[9px] font-semibold tracking-[0.16em] text-ink-faint">EMOTION NOTES</p>
            <p className="mt-2 text-xs text-ink-muted">{record.emotion_tags.join(' · ')}</p>
          </section>
        )}

        {chapter && (
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-border py-5 text-left"
            onClick={() => navigate(`/book/chapter/${chapter.id}`)}
          >
            <span>
              <span className="block text-[9px] font-semibold tracking-[0.16em] text-sage">INCLUDED IN CHAPTER</span>
              <span className="mt-2 block font-serif text-sm font-bold">CH {chapter.chapter_number} · {chapter.title}</span>
            </span>
            <span className="text-lg text-ink-faint">→</span>
          </button>
        )}
      </main>

      <RecordActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onEdit={handleEdit}
        onDelete={() => setDeleteOpen(true)}
      />

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="기록 삭제">
        <p className="mb-5 text-center text-sm text-ink-muted">이 페이지를 삭제하면 복구할 수 없어요.</p>
        <button
          type="button"
          disabled={deleting}
          className="min-h-[48px] w-full border border-danger bg-danger py-3.5 text-[14px] font-semibold text-white"
          onClick={() => void handleDelete()}
        >
          {deleting ? '삭제 중...' : '삭제'}
        </button>
      </Modal>
    </div>
  )
}
