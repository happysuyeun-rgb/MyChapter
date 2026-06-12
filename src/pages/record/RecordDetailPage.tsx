import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, Modal } from '@/components/common'
import { RecordActionSheet } from '@/components/features/record/RecordActionSheet'
import { NavBar } from '@/components/layout/NavBar'
import { deleteRecord, getPhotoSignedUrl, getRecord } from '@/lib/api/records'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useRecordStore } from '@/stores/recordStore'
import type { Chapter, JournalRecord } from '@/types/database'

const MODE_LABEL: Record<string, string> = {
  question: '💬 질문 모드',
  photo: '📸 사진 모드',
  free: '✍️ 자유 일기',
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
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  const dateLabel = new Date(record.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-[#fffdf9]">
      <NavBar
        title={`기록 #${record.record_number}`}
        leftLabel="←"
        rightLabel="···"
        onRightClick={() => setSheetOpen(true)}
      />

      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-5 flex items-center gap-2.5">
          <Badge>{MODE_LABEL[record.mode]}</Badge>
          <span className="text-xs text-ink-faint">{dateLabel}</span>
        </div>

        {record.mode === 'question' && record.question_text && (
          <Card accent className="mb-5 p-3.5">
            <p className="mb-1.5 text-[11px] font-bold text-accent">오늘의 질문</p>
            <p className="text-sm leading-relaxed">&quot;{record.question_text}&quot;</p>
          </Card>
        )}

        {record.mode === 'free' && record.title && (
          <h2 className="mb-3 text-lg font-bold">{record.title}</h2>
        )}

        {photoUrl && (
          <img
            src={photoUrl}
            alt="기록 사진"
            className="mb-5 w-full rounded-card object-cover"
          />
        )}

        <div className="font-serif text-[15px] leading-loose text-ink">
          {record.content}
        </div>

        {record.emotion_tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {record.emotion_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent px-3 py-1 text-[13px] font-semibold text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {chapter && (
          <div className="mt-5 rounded-[10px] bg-surface-alt p-3.5">
            <p className="mb-0.5 text-[11px] text-ink-faint">포함된 챕터</p>
            <p className="text-[13px] font-semibold">
              CH {chapter.chapter_number} · {chapter.title}
            </p>
          </div>
        )}
      </div>

      <RecordActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onEdit={handleEdit}
        onDelete={() => setDeleteOpen(true)}
      />

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="기록 삭제">
        <p className="mb-5 text-center text-sm text-ink-muted">
          이 기록을 삭제할까요? 복구할 수 없어요.
        </p>
        <button
          type="button"
          disabled={deleting}
          className="w-full rounded-btn bg-danger py-3.5 text-[15px] font-semibold text-white"
          onClick={() => void handleDelete()}
        >
          {deleting ? '삭제 중...' : '삭제'}
        </button>
      </Modal>
    </div>
  )
}
