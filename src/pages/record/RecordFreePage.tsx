import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Textarea } from '@/components/common'
import { EmotionTagPicker } from '@/components/features/record/EmotionTagPicker'
import { ExitConfirmModal } from '@/components/features/record/ExitConfirmModal'
import { NavBar } from '@/components/layout/NavBar'
import { useActiveProject } from '@/hooks/useActiveProject'
import { deleteDraft, loadDraft, saveDraft } from '@/lib/api/drafts'
import { generateFreewritingHint, getFallbackHint } from '@/lib/api/hints'
import { ApiError } from '@/lib/api/questions'
import { createRecord, getRecordCount, updateRecord } from '@/lib/api/records'
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

  const isDirty = content.trim().length > 0 || title.trim().length > 0

  useEffect(() => {
    if (!project || !user) return

    const init = async () => {
      if (editingRecord) {
        setRecordNumber(editingRecord.record_number)
        return
      }

      const count = await getRecordCount(project.id)
      setRecordNumber(count + 1)

      try {
        const h = await generateFreewritingHint(project.id)
        setHint(h)
      } catch (err) {
        if (err instanceof ApiError && err.code === 'AI_LIMIT') {
          showPaywall()
        }
        setHint(getFallbackHint(project.type))
      }

      const draft = await loadDraft(user.id, project.id, 'free')
      if (draft?.content) setContent(draft.content)
      if (draft?.title) setTitle(draft.title)
      if (draft?.emotionTags) setEmotions(draft.emotionTags)
    }

    void init()
  }, [project, user, editingRecord, showPaywall])

  const handleSave = async () => {
    if (!user || !project) return
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
      const result = editingRecord
        ? await updateRecord(
            editingRecord.id,
            user.id,
            project.id,
            { content: content.trim(), title: recordTitle, emotionTags: emotions },
            project.target_count,
          )
        : await createRecord(
            {
              projectId: project.id,
              userId: user.id,
              mode: 'free',
              content: content.trim(),
              title: recordTitle,
              emotionTags: emotions,
            },
            project.target_count,
          )

      await deleteDraft(user.id, project.id, 'free')
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
        title={`자유 일기 #${recordNumber}`}
        leftLabel="✕"
        onLeftClick={() => (isDirty ? setShowExit(true) : navigate(-1))}
        rightLabel={saving ? '...' : '저장'}
        rightAccent
        onRightClick={() => void handleSave()}
      />
      <div className="flex-1 overflow-y-auto p-5">
        {showHint && hint && !editingRecord && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-surface-alt p-3.5">
            <span className="text-base">✨</span>
            <div className="flex-1">
              <p className="mb-1 text-[11px] font-bold text-accent">AI 글감 제안 (선택)</p>
              <p className="text-[13px] leading-relaxed text-ink-muted">{hint}</p>
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

        <div className="mb-3 border-b border-border pb-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해주세요"
            className="w-full text-lg font-bold text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="자유롭게 써보세요"
          className="min-h-[280px] leading-loose"
          maxLength={5000}
        />
        <p className="mb-5 mt-2 text-right text-[11px] text-ink-faint">
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
          void saveDraft(user.id, project.id, 'free', {
            content,
            title,
            emotionTags: emotions,
          }).then(() => navigate(-1))
        }}
      />
    </div>
  )
}
