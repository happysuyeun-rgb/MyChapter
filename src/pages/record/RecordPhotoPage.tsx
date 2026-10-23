import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlatIcon, Input } from '@/components/common'
import { EmotionTagPicker } from '@/components/features/record/EmotionTagPicker'
import { ExitConfirmModal } from '@/components/features/record/ExitConfirmModal'
import { NavBar } from '@/components/layout/NavBar'
import { useActiveProject } from '@/hooks/useActiveProject'
import { clearRecordRequestId, getOrCreateRecordRequestId } from '@/lib/recordRequestId'
import { clearPhotoAttempt, loadPhotoAttempt, savePhotoAttempt } from '@/lib/photoAttempt'
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

const MAX_PHOTO_BYTES = 10 * 1024 * 1024

export function RecordPhotoPage() {
  const navigate = useNavigate()
  const uploadedPhotoPath = useRef<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { user } = useAuthStore()
  const { project, loading } = useActiveProject()
  const { editingRecord, setEditingRecord, setLastSave } = useRecordStore()

  const [caption, setCaption] = useState(editingRecord?.content ?? '')
  const [emotions, setEmotions] = useState<string[]>(editingRecord?.emotion_tags ?? [])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoPath] = useState(editingRecord?.photo_url ?? null)
  const [restoredPhotoPath, setRestoredPhotoPath] = useState<string | null>(null)
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

      const requestId = getOrCreateRecordRequestId(user.id, project.id, 'photo')
      const recoveredPath = loadPhotoAttempt(user.id, project.id, requestId)
      if (recoveredPath) {
        uploadedPhotoPath.current = recoveredPath
        setRestoredPhotoPath(recoveredPath)
        const preview = await getPhotoSignedUrl(recoveredPath)
        if (preview) setPhotoPreview(preview)
      }

      const draft = await loadDraft(user.id, project.id, 'photo')
      if (draft?.content) setCaption(draft.content)
      if (draft?.emotionTags) setEmotions(draft.emotionTags)
    }

    void init()
  }, [project, user, editingRecord])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 선택할 수 있어요.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('사진 용량은 10MB 이하로 해주세요.')
      return
    }
    setError('')
    uploadedPhotoPath.current = null
    setRestoredPhotoPath(null)
    if (user && project) clearPhotoAttempt(user.id, project.id)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!user || !project || saving) return
    if (!photoFile && !existingPhotoPath && !restoredPhotoPath) {
      setError('사진을 추가해주세요.')
      return
    }
    if (caption.trim().length < 1 || caption.length > 100) {
      setError('캡션은 1~100자로 작성해주세요.')
      return
    }
    if (photoFile && (!photoFile.type.startsWith('image/') || photoFile.size > MAX_PHOTO_BYTES)) {
      setError('사진 용량은 10MB 이하로 해주세요.')
      return
    }

    setSaving(true)
    setError('')

    try {
      let photoUrl = existingPhotoPath ?? restoredPhotoPath
      if (photoFile) {
        if (!uploadedPhotoPath.current) {
          uploadedPhotoPath.current = await uploadRecordPhoto(user.id, project.id, photoFile)
          if (!editingRecord) savePhotoAttempt(user.id, project.id, getOrCreateRecordRequestId(user.id, project.id, 'photo'), uploadedPhotoPath.current)
        }
        photoUrl = uploadedPhotoPath.current
      }

      const result = editingRecord
        ? await updateRecord(
            editingRecord.id,
            user.id,
            project.id,
            { content: caption.trim(), emotionTags: emotions, photoUrl: photoUrl ?? undefined }
          )
        : await createRecord(
            {
              projectId: project.id,
              userId: user.id,
              requestId: getOrCreateRecordRequestId(user.id, project.id, 'photo'),
              mode: 'photo',
              content: caption.trim(),
              photoUrl: photoUrl!,
              emotionTags: emotions,
            }
          )

      try { await deleteDraft(user.id, project.id, 'photo') } catch { /* saved record remains valid */ }
      if (!editingRecord) {
        clearPhotoAttempt(user.id, project.id)
        clearRecordRequestId(user.id, project.id, 'photo')
      }
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
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar
        title={`PAGE ${String(recordNumber).padStart(2, '0')}`}
        leftLabel="✕"
        onLeftClick={() => (isDirty ? setShowExit(true) : navigate(-1))}
        rightLabel={saving ? '...' : '저장'}
        rightAccent
        onRightClick={() => void handleSave()}
      />
      <div className="flex-1 overflow-y-auto px-5 pb-8 pt-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mb-7 flex h-[280px] w-full flex-col items-center justify-center gap-3 overflow-hidden border-y border-border bg-surface-card"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="미리보기" className="h-full w-full object-cover" />
          ) : (
            <>
              <FlatIcon name="book" size={30} className="text-sage" />
              <span className="font-serif text-base font-bold">오늘의 장면 한 장</span>
              <span className="text-xs text-ink-muted">사진을 눌러 선택해주세요</span>
            </>
          )}
        </button>

        <p className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-ink-faint">CAPTION</p>
        <Input
          active
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="오늘의 한 줄"
          maxLength={100}
        />
        <p className="mb-7 mt-2 border-t border-border pt-2 text-right text-[11px] text-ink-faint">
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
          }).then(() => navigate(-1)).catch(() => {
            setShowExit(false)
            setError('임시저장에 실패했어요. 작성한 내용은 유지됩니다.')
          })
        }}
      />
    </div>
  )
}
