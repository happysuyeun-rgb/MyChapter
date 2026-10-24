import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlatIcon, Input } from '@/components/common'
import { EmotionTagPicker } from '@/components/features/record/EmotionTagPicker'
import { ExitConfirmModal } from '@/components/features/record/ExitConfirmModal'
import { SaveConflictModal } from '@/components/features/record/SaveConflictModal'
import { NavBar } from '@/components/layout/NavBar'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useRecordCreateSave } from '@/hooks/useRecordCreateSave'
import { clearRecordRequestId, getOrCreateRecordRequestId } from '@/lib/recordRequestId'
import { clearPhotoAttempt, loadPhotoAttempt, savePhotoAttempt } from '@/lib/photoAttempt'
import { deleteDraft, loadDraft, saveDraft } from '@/lib/api/drafts'
import {
  getPhotoSignedUrl,
  getRecordCount,
  removeUnreferencedPhoto,
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
  const {
    conflictOpen,
    error,
    setError,
    saveCreate,
    openExisting,
    saveAsNew,
    clearConflict,
  } = useRecordCreateSave()

  const [caption, setCaption] = useState(editingRecord?.content ?? '')
  const [emotions, setEmotions] = useState<string[]>(editingRecord?.emotion_tags ?? [])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoPath] = useState(editingRecord?.photo_url ?? null)
  const [restoredPhotoPath, setRestoredPhotoPath] = useState<string | null>(null)
  const [recordNumber, setRecordNumber] = useState(editingRecord?.record_number ?? 1)
  const [saving, setSaving] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [pageNumberHint, setPageNumberHint] = useState(!editingRecord)

  const touched = useRef(Boolean(editingRecord))
  const initialization = useRef(0)
  const isDirty = caption.trim().length > 0 || photoFile !== null

  useEffect(() => {
    if (!project || !user) return

    const generation = ++initialization.current
    const init = async () => {
      if (editingRecord) {
        setRecordNumber(editingRecord.record_number)
        setPageNumberHint(false)
        if (editingRecord.photo_url) {
          const url = await getPhotoSignedUrl(editingRecord.photo_url)
          if (initialization.current === generation) setPhotoPreview(url)
        }
        return
      }

      try {
        const count = await getRecordCount(project.id)
        if (initialization.current !== generation) return
        setRecordNumber(count + 1)
        setPageNumberHint(true)
      } catch {
        if (initialization.current === generation) {
          setError('기록 번호를 불러오지 못했어요. 저장은 가능해요.')
        }
      }

      const requestId = getOrCreateRecordRequestId(user.id, project.id, 'photo')
      const recoveredPath = loadPhotoAttempt(user.id, project.id, requestId)
      if (recoveredPath && !touched.current && initialization.current === generation) {
        uploadedPhotoPath.current = recoveredPath
        setRestoredPhotoPath(recoveredPath)
        const preview = await getPhotoSignedUrl(recoveredPath)
        if (!touched.current && initialization.current === generation && preview) {
          setPhotoPreview(preview)
        }
      }

      try {
        const draft = await loadDraft(user.id, project.id, 'photo')
        if (draft && !touched.current && initialization.current === generation) {
          if (draft.content) setCaption(draft.content)
          if (draft.emotionTags) setEmotions(draft.emotionTags)
        }
      } catch {
        if (initialization.current === generation) {
          setError('임시저장 기록을 불러오지 못했어요. 다시 접속해 확인해주세요.')
        }
      }
    }

    void init()
    return () => {
      initialization.current++
    }
  }, [project, user, editingRecord, setError])

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
    touched.current = true

    const previousTemp = uploadedPhotoPath.current
    uploadedPhotoPath.current = null
    setRestoredPhotoPath(null)
    if (user && project) {
      clearPhotoAttempt(user.id, project.id)
      if (previousTemp && previousTemp !== existingPhotoPath) {
        void removeUnreferencedPhoto(user.id, project.id, previousTemp)
      }
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const finishSave = async (result: Awaited<ReturnType<typeof updateRecord>>) => {
    if (user && project) {
      try {
        await deleteDraft(user.id, project.id, 'photo')
      } catch {
        /* ok */
      }
      clearPhotoAttempt(user.id, project.id)
      clearRecordRequestId(user.id, project.id, 'photo')
    }
    setEditingRecord(null)
    setLastSave(result, project!)
    navigate('/record/complete')
  }

  const currentPhotoUrl = (): string | null =>
    uploadedPhotoPath.current ?? restoredPhotoPath ?? existingPhotoPath

  const ensureUploaded = async (): Promise<string> => {
    if (!user || !project) throw new Error('missing context')
    let photoUrl = currentPhotoUrl()
    if (photoFile) {
      if (!uploadedPhotoPath.current) {
        uploadedPhotoPath.current = await uploadRecordPhoto(user.id, project.id, photoFile)
        if (!editingRecord) {
          savePhotoAttempt(
            user.id,
            project.id,
            getOrCreateRecordRequestId(user.id, project.id, 'photo'),
            uploadedPhotoPath.current,
          )
        }
      }
      photoUrl = uploadedPhotoPath.current
    }
    if (!photoUrl) throw new Error('photo required')
    return photoUrl
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
      const photoUrl = await ensureUploaded()

      if (editingRecord) {
        const previous = existingPhotoPath
        const result = await updateRecord(editingRecord.id, user.id, project.id, {
          content: caption.trim(),
          emotionTags: emotions,
          photoUrl,
        })
        if (previous && previous !== photoUrl) {
          void removeUnreferencedPhoto(user.id, project.id, previous)
        }
        await finishSave(result)
      } else {
        await saveCreate({
          userId: user.id,
          projectId: project.id,
          mode: 'photo',
          buildInput: (requestId) => ({
            projectId: project.id,
            userId: user.id,
            requestId,
            mode: 'photo',
            content: caption.trim(),
            photoUrl,
            emotionTags: emotions,
          }),
          onSuccess: finishSave,
          onClearSideEffects: () => {
            if (user && project) clearPhotoAttempt(user.id, project.id)
          },
        })
      }
    } catch {
      setError('저장에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const discardTempUpload = () => {
    if (user && project) {
      const temp = uploadedPhotoPath.current
      clearPhotoAttempt(user.id, project.id)
      clearRecordRequestId(user.id, project.id, 'photo')
      if (temp && temp !== existingPhotoPath) {
        void removeUnreferencedPhoto(user.id, project.id, temp)
      }
    }
    uploadedPhotoPath.current = null
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
        title={
          pageNumberHint
            ? `예상 PAGE ${String(recordNumber).padStart(2, '0')}`
            : `PAGE ${String(recordNumber).padStart(2, '0')}`
        }
        leftLabel="✕"
        onLeftClick={() => (isDirty ? setShowExit(true) : navigate(-1))}
        rightLabel={saving ? '저장 중...' : '저장'}
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
          onChange={(e) => {
            touched.current = true
            setCaption(e.target.value)
          }}
          placeholder="오늘의 한 줄"
          maxLength={100}
        />
        <p className="mb-7 mt-2 border-t border-border pt-2 text-right text-[11px] text-ink-faint">
          {caption.length}자 / 최대 100자
        </p>

        <EmotionTagPicker
          selected={emotions}
          onChange={(value) => {
            touched.current = true
            setEmotions(value)
          }}
        />
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {pageNumberHint && !editingRecord && (
          <p className="mt-3 text-[11px] text-ink-faint">저장 후 확정 PAGE 번호가 표시됩니다.</p>
        )}
      </div>

      <ExitConfirmModal
        open={showExit}
        onContinue={() => setShowExit(false)}
        onDiscard={() => {
          discardTempUpload()
          setEditingRecord(null)
          navigate(-1)
        }}
        onSaveDraft={() => {
          if (!user || !project) return
          void saveDraft(user.id, project.id, 'photo', {
            content: caption,
            emotionTags: emotions,
          })
            .then(() => navigate(-1))
            .catch(() => {
              setShowExit(false)
              setError('임시저장에 실패했어요. 작성한 내용은 유지됩니다.')
            })
        }}
      />

      <SaveConflictModal
        open={conflictOpen}
        onContinue={clearConflict}
        onOpenExisting={openExisting}
        onSaveAsNew={() => {
          void (async () => {
            setSaving(true)
            try {
              await saveAsNew()
            } finally {
              setSaving(false)
            }
          })()
        }}
      />
    </div>
  )
}
