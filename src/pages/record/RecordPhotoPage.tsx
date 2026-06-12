import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/common'
import { EmotionTagPicker } from '@/components/features/record/EmotionTagPicker'
import { ExitConfirmModal } from '@/components/features/record/ExitConfirmModal'
import { NavBar } from '@/components/layout/NavBar'
import { useActiveProject } from '@/hooks/useActiveProject'
import { deleteDraft, loadDraft, saveDraft } from '@/lib/api/drafts'
import {
  createRecord,
  getPhotoSignedUrl,
  getRecordCount,
  updateRecord,
  uploadRecordPhoto,
} from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'
import { useRecordStore } from '@/stores/recordStore'

export function RecordPhotoPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const { user } = useAuthStore()
  const { project, loading } = useActiveProject()
  const { editingRecord, setEditingRecord, setLastSave } = useRecordStore()

  const [caption, setCaption] = useState(editingRecord?.content ?? '')
  const [emotions, setEmotions] = useState<string[]>(editingRecord?.emotion_tags ?? [])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoPath] = useState(editingRecord?.photo_url ?? null)
  const [recordNumber, setRecordNumber] = useState(editingRecord?.record_number ?? 1)
  const [saving, setSaving] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [error, setError] = useState('')

  const isDirty = caption.trim().length > 0 || photoFile !== null

  useEffect(() => {
    if (!project || !user) return

    const init = async () => {
      if (editingRecord) {
        setRecordNumber(editingRecord.record_number)
        if (editingRecord.photo_url) {
          const url = await getPhotoSignedUrl(editingRecord.photo_url)
          setPhotoPreview(url)
        }
        return
      }

      const count = await getRecordCount(project.id)
      setRecordNumber(count + 1)

      const draft = await loadDraft(user.id, project.id, 'photo')
      if (draft?.content) setCaption(draft.content)
      if (draft?.emotionTags) setEmotions(draft.emotionTags)
    }

    void init()
  }, [project, user, editingRecord])

  const handleFile = (file: File) => {
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!user || !project) return
    if (!photoFile && !existingPhotoPath) {
      setError('사진을 추가해주세요.')
      return
    }
    if (caption.trim().length < 1 || caption.length > 100) {
      setError('캡션은 1~100자로 작성해주세요.')
      return
    }

    setSaving(true)
    setError('')

    try {
      let photoUrl = existingPhotoPath
      if (photoFile) {
        photoUrl = await uploadRecordPhoto(user.id, project.id, photoFile)
      }

      const result = editingRecord
        ? await updateRecord(
            editingRecord.id,
            user.id,
            project.id,
            { content: caption.trim(), emotionTags: emotions, photoUrl: photoUrl ?? undefined },
            project.target_count,
          )
        : await createRecord(
            {
              projectId: project.id,
              userId: user.id,
              mode: 'photo',
              content: caption.trim(),
              photoUrl: photoUrl!,
              emotionTags: emotions,
            },
            project.target_count,
          )

      await deleteDraft(user.id, project.id, 'photo')
      setEditingRecord(null)
      setLastSave(result, project)
      navigate('/record/complete')
    } catch {
      setError('저장에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !project) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar
        title={`사진 기록 #${recordNumber}`}
        leftLabel="✕"
        onLeftClick={() => (isDirty ? setShowExit(true) : navigate(-1))}
        rightLabel={saving ? '...' : '저장'}
        rightAccent
        onRightClick={() => void handleSave()}
      />
      <div className="flex-1 overflow-y-auto p-5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mb-5 flex h-[220px] w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-card border-[1.5px] border-dashed border-border-strong bg-surface-alt"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="미리보기" className="h-full w-full object-cover" />
          ) : (
            <>
              <span className="text-4xl">📷</span>
              <span className="text-sm font-semibold">사진 추가하기</span>
              <span className="text-sm text-ink-muted">갤러리 또는 카메라</span>
            </>
          )}
        </button>

        <p className="mb-2 text-xs font-semibold text-ink-muted">한줄 캡션</p>
        <Input
          active
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="오늘의 한 줄"
          maxLength={100}
        />
        <p className="mb-5 mt-1.5 text-right text-[11px] text-ink-faint">
          {caption.length}자 / 최대 100자
        </p>

        <EmotionTagPicker selected={emotions} onChange={setEmotions} />
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>

      <ExitConfirmModal
        open={showExit}
        onContinue={() => setShowExit(false)}
        onDiscard={() => {
          setEditingRecord(null)
          navigate(-1)
        }}
        onSaveDraft={() => {
          if (!user || !project) return
          void saveDraft(user.id, project.id, 'photo', {
            content: caption,
            emotionTags: emotions,
          }).then(() => navigate(-1))
        }}
      />
    </div>
  )
}
