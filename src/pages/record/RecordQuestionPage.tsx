import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Textarea } from '@/components/common'
import { EmotionTagPicker } from '@/components/features/record/EmotionTagPicker'
import { ExitConfirmModal } from '@/components/features/record/ExitConfirmModal'
import { NavBar } from '@/components/layout/NavBar'
import { useActiveProject } from '@/hooks/useActiveProject'
import { deleteDraft, loadDraft, saveDraft } from '@/lib/api/drafts'
import { createRecord, getRecordCount, updateRecord } from '@/lib/api/records'
import { ApiError, generateQuestion, getFallbackQuestion, getTodayQuestion } from '@/lib/api/questions'
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

      const cached = await getTodayQuestion(project.id)
      if (cached) {
        setQuestion(cached)
      } else {
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

      const draft = await loadDraft(user.id, project.id, 'question')
      if (draft?.content) setContent(draft.content)
      if (draft?.emotionTags) setEmotions(draft.emotionTags)
      if (draft?.questionText) setQuestion(draft.questionText)
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
            { content: content.trim(), emotionTags: emotions, questionText: question },
            project.target_count,
          )
        : await createRecord(
            {
              projectId: project.id,
              userId: user.id,
              mode: 'question',
              content: content.trim(),
              questionText: question,
              emotionTags: emotions,
            },
            project.target_count,
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
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar
        title={`오늘의 기록 #${recordNumber}`}
        leftLabel="✕"
        onLeftClick={handleClose}
        rightLabel={saving ? '...' : '저장'}
        rightAccent
        onRightClick={() => void handleSave()}
      />
      <div className="flex-1 overflow-y-auto p-5">
        <Card accent className="mb-5 p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-accent">
            💬 오늘의 질문
          </p>
          <p className="text-[15px] font-medium leading-relaxed">
            &quot;{question || '질문을 불러오는 중...'}&quot;
          </p>
        </Card>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘의 이야기를 적어보세요"
          className="min-h-[200px]"
          maxLength={2000}
        />
        <p className="mb-5 mt-1.5 text-right text-[11px] text-ink-faint">
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
