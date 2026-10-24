import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Textarea } from '@/components/common'
import { EmotionTagPicker } from '@/components/features/record/EmotionTagPicker'
import { ExitConfirmModal } from '@/components/features/record/ExitConfirmModal'
import { SaveConflictModal } from '@/components/features/record/SaveConflictModal'
import { NavBar } from '@/components/layout/NavBar'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useRecordCreateSave } from '@/hooks/useRecordCreateSave'
import { clearRecordRequestId } from '@/lib/recordRequestId'
import { deleteDraft, loadDraft, saveDraft } from '@/lib/api/drafts'
import { getRecordCount, updateRecord } from '@/lib/api/records'
import { ApiError, generateQuestion, getFallbackQuestion } from '@/lib/api/questions'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { useRecordStore } from '@/stores/recordStore'

export function RecordQuestionPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { showPaywall } = usePaywallStore()
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

  const isEdit = Boolean(editingRecord)
  const [question, setQuestion] = useState(editingRecord?.question_text ?? '')
  const [content, setContent] = useState(editingRecord?.content ?? '')
  const [emotions, setEmotions] = useState<string[]>(editingRecord?.emotion_tags ?? [])
  const [recordNumber, setRecordNumber] = useState(editingRecord?.record_number ?? 1)
  const [saving, setSaving] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [pageNumberHint, setPageNumberHint] = useState(!editingRecord)

  const touched = useRef(Boolean(editingRecord))
  const initialization = useRef(0)
  const isDirty = content.trim().length > 0

  useEffect(() => {
    if (!project || !user) return

    const generation = ++initialization.current
    const init = async () => {
      if (editingRecord) {
        setQuestion(editingRecord.question_text ?? '')
        setRecordNumber(editingRecord.record_number)
        setPageNumberHint(false)
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

      let draftQuestion: string | null = null
      try {
        const draft = await loadDraft(user.id, project.id, 'question')
        if (draft && !touched.current && initialization.current === generation) {
          if (draft.content) setContent(draft.content)
          if (draft.emotionTags) setEmotions(draft.emotionTags)
          if (draft.questionText) {
            draftQuestion = draft.questionText
            setQuestion(draft.questionText)
          }
        }
      } catch {
        if (initialization.current === generation) {
          setError('임시저장 기록을 불러오지 못했어요. 다시 접속해 확인해주세요.')
        }
      }

      if (draftQuestion || touched.current || initialization.current !== generation) return

      try {
        const q = await generateQuestion(project.id)
        if (!touched.current && initialization.current === generation) setQuestion(q)
      } catch (err) {
        if (err instanceof ApiError && err.code === 'AI_LIMIT') showPaywall()
        if (!touched.current && initialization.current === generation) {
          setQuestion(getFallbackQuestion(project.type))
        }
      }
    }

    void init()
    return () => {
      initialization.current++
    }
  }, [project, user, editingRecord, showPaywall, setError])

  const handleClose = () => {
    if (isDirty) setShowExit(true)
    else {
      setEditingRecord(null)
      navigate(-1)
    }
  }

  const finishSave = async (result: Awaited<ReturnType<typeof updateRecord>>) => {
    if (user && project) {
      try {
        await deleteDraft(user.id, project.id, 'question')
      } catch {
        /* ok */
      }
    }
    setEditingRecord(null)
    setLastSave(result, project!)
    navigate('/record/complete')
  }

  const handleSave = async () => {
    if (!user || !project || saving) return
    if (content.trim().length < 10) {
      setError('최소 10자 이상 작성해주세요.')
      return
    }
    if (content.length > 2000) {
      setError('최대 2000자까지 작성할 수 있어요.')
      return
    }
    if (!question.trim()) {
      setError('질문을 불러온 뒤 저장해주세요.')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (isEdit && editingRecord) {
        const result = await updateRecord(editingRecord.id, user.id, project.id, {
          content: content.trim(),
          emotionTags: emotions,
          questionText: question,
        })
        await finishSave(result)
      } else {
        await saveCreate({
          userId: user.id,
          projectId: project.id,
          mode: 'question',
          buildInput: (requestId) => ({
            projectId: project.id,
            userId: user.id,
            requestId,
            mode: 'question',
            content: content.trim(),
            questionText: question,
            emotionTags: emotions,
          }),
          onSuccess: finishSave,
        })
      }
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
        title={
          pageNumberHint
            ? `예상 PAGE ${String(recordNumber).padStart(2, '0')}`
            : `PAGE ${String(recordNumber).padStart(2, '0')}`
        }
        leftLabel="✕"
        onLeftClick={handleClose}
        rightLabel={saving ? '저장 중...' : '저장'}
        rightAccent
        onRightClick={() => void handleSave()}
      />
      <div className="flex-1 overflow-y-auto px-5 pb-8 pt-6">
        <section className="border-y border-ink py-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">PAGE'S QUESTION</p>
          <p className="mt-3 font-serif text-[21px] font-bold leading-8 tracking-[-0.02em]">
            {question || '질문을 불러오는 중...'}
          </p>
          <p className="mt-4 text-[11px] leading-5 text-ink-muted">
            정답처럼 쓰지 않아도 괜찮아요. 떠오르는 장면부터 시작해보세요.
          </p>
        </section>

        <div className="mt-7">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-ink-faint">YOUR PAGE</p>
          <Textarea
            value={content}
            onChange={(e) => {
              touched.current = true
              setContent(e.target.value)
            }}
            placeholder="오늘의 이야기를 적어보세요"
            className="min-h-[280px] border-0 bg-transparent px-0 font-serif text-[16px] leading-8 shadow-none focus:ring-0"
            maxLength={2000}
          />
        </div>
        <p className="mb-7 mt-1.5 border-t border-border pt-2 text-right text-[11px] text-ink-faint">
          {content.length}자
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
          if (user && project) clearRecordRequestId(user.id, project.id, 'question')
          setEditingRecord(null)
          navigate(-1)
        }}
        onSaveDraft={() => {
          if (!user || !project) return
          void saveDraft(user.id, project.id, 'question', {
            content,
            emotionTags: emotions,
            questionText: question,
          })
            .then(() => {
              setEditingRecord(null)
              navigate(-1)
            })
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
