import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Textarea } from '@/components/common'
import { EmotionTagPicker } from '@/components/features/record/EmotionTagPicker'
import { ExitConfirmModal } from '@/components/features/record/ExitConfirmModal'
import { NavBar } from '@/components/layout/NavBar'
import { useActiveProject } from '@/hooks/useActiveProject'
import { clearRecordRequestId, getOrCreateRecordRequestId } from '@/lib/recordRequestId'
import { deleteDraft, loadDraft, saveDraft } from '@/lib/api/drafts'
import { generateFreewritingHint, getFallbackHint } from '@/lib/api/hints'
import { ApiError } from '@/lib/api/questions'
import { createRecord, getRecordCount, RecordRequestConflictError, updateRecord } from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { useRecordStore } from '@/stores/recordStore'

export function RecordFreePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { showPaywall } = usePaywallStore()
  const { project, loading } = useActiveProject()
  const { editingRecord, setEditingRecord, setLastSave } = useRecordStore()

  const [hint, setHint] = useState('')
  const [showHint, setShowHint] = useState(true)
  const [title, setTitle] = useState(editingRecord?.title ?? '')
  const [content, setContent] = useState(editingRecord?.content ?? '')
  const [emotions, setEmotions] = useState<string[]>(editingRecord?.emotion_tags ?? [])
  const [recordNumber, setRecordNumber] = useState(editingRecord?.record_number ?? 1)
  const [saving, setSaving] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [error, setError] = useState('')

  const touched = useRef(false)
  const initialization = useRef(0)
  const isDirty = content.trim().length > 0 || title.trim().length > 0

  useEffect(() => {
    if (!project || !user) return

    const generation = ++initialization.current
    const init = async () => {
      if (editingRecord) {
        setRecordNumber(editingRecord.record_number)
        return
      }

      const count = await getRecordCount(project.id)
      if (initialization.current !== generation) return
      setRecordNumber(count + 1)

      try {
        const draft = await loadDraft(user.id, project.id, 'free')
        if (draft && !touched.current && initialization.current === generation) {
          setContent(draft.content ?? '')
          setTitle(draft.title ?? '')
          setEmotions(draft.emotionTags ?? [])
        }
      } catch {
        if (initialization.current === generation) setError('임시저장 기록을 불러오지 못했어요. 다시 접속해 확인해주세요.')
      }

      try {
        const h = await generateFreewritingHint(project.id)
        if (initialization.current === generation) setHint(h)
      } catch (err) {
        if (err instanceof ApiError && err.code === 'AI_LIMIT') {
          showPaywall()
        }
        if (initialization.current === generation) setHint(getFallbackHint(project.type))
      }
    }

    void init()
    return () => { initialization.current++ }
  }, [project, user, editingRecord, showPaywall])

  const handleSave = async () => {
    if (!user || !project || saving) return
    if (editingRecord && (editingRecord.user_id !== user.id || editingRecord.project_id !== project.id)) {
      setError('다른 책의 기록은 여기에서 수정할 수 없어요. 기록 목록에서 다시 열어주세요.')
      return
    }
    if (content.trim().length < 10) {
      setError('최소 10자 이상 작성해주세요.')
      return
    }
    if (content.length > 5000) {
      setError('최대 5000자까지 작성할 수 있어요.')
      return
    }

    setSaving(true)
    setError('')

    const recordTitle =
      title.trim() ||
      new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })

    try {
      const createOnce = () =>
        createRecord({
          projectId: project.id,
          userId: user.id,
          requestId: getOrCreateRecordRequestId(user.id, project.id, 'free'),
          mode: 'free',
          content: content.trim(),
          title: recordTitle,
          emotionTags: emotions,
        })

      let result
      if (editingRecord) {
        result = await updateRecord(
          editingRecord.id,
          user.id,
          project.id,
          { content: content.trim(), title: recordTitle, emotionTags: emotions },
        )
      } else {
        try {
          result = await createOnce()
        } catch (err) {
          if (!(err instanceof RecordRequestConflictError)) throw err
          clearRecordRequestId(user.id, project.id, 'free')
          result = await createOnce()
        }
      }

      // Draft cleanup is non-critical: an already persisted record must not be reported as a failed save.
      try {
        await deleteDraft(user.id, project.id, 'free')
      } catch {
        // Keep the saved result; cleanup can be retried separately.
      }
      if (!editingRecord) clearRecordRequestId(user.id, project.id, 'free')
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
        {showHint && hint && !editingRecord && (
          <div className="mb-7 border-l-2 border-sage pl-4">
            <div className="flex-1">
              <p className="mb-1 text-[10px] font-semibold tracking-[0.16em] text-sage">PAGE'S NOTE · OPTIONAL</p>
              <p className="font-serif text-[14px] leading-6 text-ink-muted">{hint}</p>
            </div>
            <button
              type="button"
              className="text-xs text-ink-faint"
              onClick={() => setShowHint(false)}
            >
              닫기
            </button>
          </div>
        )}

        <div className="mb-4 border-b border-ink pb-3">
          <input
            type="text"
            value={title}
            onChange={(e) => { touched.current = true; setTitle(e.target.value) }}
            placeholder="제목을 입력해주세요"
            maxLength={50}
            className="w-full bg-transparent font-serif text-[22px] font-bold tracking-[-0.02em] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        <Textarea
          value={content}
          onChange={(e) => { touched.current = true; setContent(e.target.value) }}
          placeholder="자유롭게 써보세요"
          className="min-h-[360px] border-0 bg-transparent px-0 font-serif text-[16px] leading-8 shadow-none focus:ring-0"
          maxLength={5000}
        />
        <p className="mb-7 mt-2 border-t border-border pt-2 text-right text-[11px] text-ink-faint">
          {content.length}자
        </p>

        <EmotionTagPicker selected={emotions} onChange={(value) => { touched.current = true; setEmotions(value) }} />
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>

      <ExitConfirmModal
        open={showExit}
        onContinue={() => setShowExit(false)}
        onDiscard={() => {
          if (user && project) clearRecordRequestId(user.id, project.id, 'free')
          setEditingRecord(null)
          navigate(-1)
        }}
        onSaveDraft={() => {
          if (!user || !project) return
          void saveDraft(user.id, project.id, 'free', {
            content,
            title,
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
