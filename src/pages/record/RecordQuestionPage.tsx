import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Textarea } from '@/components/common'
import { EmotionTagPicker } from '@/components/features/record/EmotionTagPicker'
import { ExitConfirmModal } from '@/components/features/record/ExitConfirmModal'
import { NavBar } from '@/components/layout/NavBar'
import { useActiveProject } from '@/hooks/useActiveProject'
import { deleteDraft, loadDraft, saveDraft } from '@/lib/api/drafts'
import { createRecord, getRecordCount, updateRecord } from '@/lib/api/records'
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

  const isEdit = Boolean(editingRecord)
  const [question, setQuestion] = useState('')
  const [content, setContent] = useState(editingRecord?.content ?? '')
  const [emotions, setEmotions] = useState<string[]>(editingRecord?.emotion_tags ?? [])
  const [recordNumber, setRecordNumber] = useState(editingRecord?.record_number ?? 1)
  const [saving, setSaving] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [error, setError] = useState('')

  const isDirty = content.trim().length > 0

  useEffect(() => {
    if (!project || !user) return

    const init = async () => {
      if (editingRecord) {
        setQuestion(editingRecord.question_text ?? '')
        setRecordNumber(editingRecord.record_number)
        return
      }

      const count = await getRecordCount(project.id)
      setRecordNumber(count + 1)

      const draft = await loadDraft(user.id, project.id, 'question')
      if (draft?.content) setContent(draft.content)
      if (draft?.emotionTags) setEmotions(draft.emotionTags)

      if (draft?.questionText) {
        setQuestion(draft.questionText)
        return
      }

      try {
        const q = await generateQuestion(project.id)
        setQuestion(q)
      } catch (err) {
        if (err instanceof ApiError && err.code === 'AI_LIMIT') {
          showPaywall()
        }
        setQuestion(getFallbackQuestion(project.type))
      }
    }

    void init()
  }, [project, user, editingRecord, showPaywall])

  const handleClose = () => {
    if (isDirty) setShowExit(true)
    else {
      setEditingRecord(null)
      navigate(-1)
    }
  }

  const handleSave = async () => {
    if (!user || !project) return
    if (content.trim().length < 10) {
      setError('최소 10자 이상 작성해주세요.')
      return
    }
    if (content.length > 2000) {
      setError('최대 2000자까지 작성할 수 있어요.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const result = isEdit && editingRecord
        ? await updateRecord(
            editingRecord.id,
            user.id,
            project.id,
            { content: content.trim(), emotionTags: emotions, questionText: question }
          )
        : await createRecord(
            {
              projectId: project.id,
              userId: user.id,
              mode: 'question',
              content: content.trim(),
              questionText: question,
              emotionTags: emotions,
            }
          )

      await deleteDraft(user.id, project.id, 'question')
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
        onLeftClick={handleClose}
        rightLabel={saving ? '...' : '저장'}
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
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘의 이야기를 적어보세요"
          className="min-h-[280px] border-0 bg-transparent px-0 font-serif text-[16px] leading-8 shadow-none focus:ring-0"
          maxLength={2000}
        />
        </div>
        <p className="mb-7 mt-1.5 border-t border-border pt-2 text-right text-[11px] text-ink-faint">
          {content.length}자
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
          void saveDraft(user.id, project.id, 'question', {
            content,
            emotionTags: emotions,
            questionText: question,
          }).then(() => {
            setEditingRecord(null)
            navigate(-1)
          })
        }}
      />
    </div>
  )
}
