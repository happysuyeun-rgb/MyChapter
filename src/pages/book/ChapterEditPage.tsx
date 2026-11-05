import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ErrorState, Input, LoadingBlock, Modal, Textarea } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import {
  AI_EDIT_FREE_MONTHLY_LIMIT,
  AI_EDIT_MAX_LENGTH,
  AI_EDIT_MIN_LENGTH,
  AiEditError,
  editChapterWithAi,
  getAiEditUsedThisMonth,
  isAiEditEnabled,
} from '@/lib/api/aiEdit'
import { ChapterApiError, getChapter, regenerateChapter, updateChapterContent } from '@/lib/api/chapters'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import type { Chapter } from '@/types/database'
import { getChapterDisplayContent } from '@/utils/chapterContent'
import { useToastStore } from '@/stores/toastStore'

export function ChapterEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { showToast } = useToastStore()

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const { isPro } = useSubscription()
  const { showPaywall } = usePaywallStore()
  const aiEditEnabled = isAiEditEnabled()
  const [aiEditing, setAiEditing] = useState(false)
  const [aiSource, setAiSource] = useState('')
  const [aiResult, setAiResult] = useState<{ text: string; notes: string[] } | null>(null)
  const [aiView, setAiView] = useState<'edited' | 'original'>('edited')
  const [aiRemaining, setAiRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!user || !aiEditEnabled || isPro) {
      setAiRemaining(null)
      return
    }
    let cancelled = false
    getAiEditUsedThisMonth(user.id)
      .then((used) => {
        if (!cancelled) setAiRemaining(Math.max(0, AI_EDIT_FREE_MONTHLY_LIMIT - used))
      })
      .catch(() => {
        if (!cancelled) setAiRemaining(null)
      })
    return () => { cancelled = true }
  }, [user, aiEditEnabled, isPro])

  useEffect(() => {
    if (!id || !user) return
    let cancelled = false
    setLoadError(false)

    getChapter(id, user.id)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          navigate('/book', { replace: true })
          return
        }
        setChapter(data)
        setTitle(data.title)
        setContent(getChapterDisplayContent(data))
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => { cancelled = true }
  }, [id, user, navigate, retryKey])

  const canSave = Boolean(title.trim() && content.trim())

  const handleSave = async () => {
    if (!chapter || saving || regenerating) return
    if (!canSave) {
      showToast('챕터 제목과 원고를 모두 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      const updated = await updateChapterContent(chapter.id, title.trim(), content.trim())
      setChapter(updated)
      navigate(`/book/chapter/${chapter.id}`, { replace: true })
    } catch {
      showToast('저장에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerate = async () => {
    if (!chapter) return
    setConfirmOpen(false)
    setRegenerating(true)
    try {
      const updated = await regenerateChapter(chapter.id)
      setChapter(updated)
      setTitle(updated.title)
      setContent(getChapterDisplayContent(updated))
      showToast('원본 기록으로 원고를 다시 구성했어요.')
    } catch (err) {
      const message =
        err instanceof ChapterApiError
          ? err.code === 'AI_UNAVAILABLE'
            ? `${err.message} 다시 시도해주세요.`
            : err.message
          : err instanceof Error && err.message
            ? err.message
            : '챕터 재생성에 실패했어요. 다시 시도해주세요.'
      showToast(message)
    } finally {
      setRegenerating(false)
    }
  }

  const requestAiEdit = async (source: string) => {
    if (!chapter || aiEditing) return
    const trimmed = source.trim()
    if (trimmed.length < AI_EDIT_MIN_LENGTH) {
      showToast(`${AI_EDIT_MIN_LENGTH}자 이상 쓴 원고만 다듬을 수 있어요.`)
      return
    }
    if (trimmed.length > AI_EDIT_MAX_LENGTH) {
      showToast(`한 번에 ${AI_EDIT_MAX_LENGTH.toLocaleString()}자까지 다듬을 수 있어요.`)
      return
    }
    if (!isPro && aiRemaining === 0) {
      showPaywall()
      return
    }
    setAiEditing(true)
    try {
      const result = await editChapterWithAi(chapter.id, trimmed)
      setAiSource(trimmed)
      setAiResult({ text: result.text, notes: result.notes })
      setAiView('edited')
      if (result.remaining != null) setAiRemaining(result.remaining)
    } catch (err) {
      if (err instanceof AiEditError && err.code === 'AI_LIMIT') {
        setAiRemaining(0)
        setAiResult(null)
        if (isPro) showToast(err.message)
        else showPaywall()
        return
      }
      showToast(err instanceof Error && err.message ? err.message : 'PAGE가 원고를 다듬지 못했어요.')
    } finally {
      setAiEditing(false)
    }
  }

  const applyAiEdit = () => {
    if (!aiResult) return
    setContent(aiResult.text)
    setAiResult(null)
    showToast('다듬은 원고를 넣었어요. 저장해야 반영돼요.')
  }

  if (loadError) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <NavBar title="원고 편집" leftLabel="←" />
        <ErrorState
          title="원고를 불러오지 못했어요"
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <LoadingBlock label="원고를 불러오는 중..." />
      </div>
    )
  }

  const dirty = title !== chapter.title || content !== getChapterDisplayContent(chapter)
  const leave = () => navigate(`/book/chapter/${chapter.id}`)

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <NavBar
        title="원고 편집"
        leftLabel="취소"
        rightLabel="저장"
        rightAccent
        onLeftClick={() => (dirty ? setLeaveConfirmOpen(true) : leave())}
        onRightClick={() => void handleSave()}
      />

      <main className="flex-1 overflow-y-auto px-5 pb-8 pt-7">
        <header className="border-b border-ink pb-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">
            EDITING · CHAPTER {String(chapter.chapter_number).padStart(2, '0')}
          </p>
          <div className="mt-5">
            <label className="mb-2 block text-[9px] font-semibold tracking-[0.15em] text-ink-faint">CHAPTER TITLE</label>
            <Input
              active
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={30}
              className="font-serif text-[21px] font-bold"
            />
          </div>
        </header>

        <section className="pt-7">
          <label className="mb-2 block text-[9px] font-semibold tracking-[0.15em] text-ink-faint">MANUSCRIPT</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="min-h-[460px] border-0 bg-transparent px-0 font-serif text-[16px] leading-8 focus:border-0"
          />
          <p className="border-t border-border pt-2 text-right text-[10px] text-ink-faint">{content.length}자</p>
        </section>

        {aiEditEnabled && (
          <section className="mt-8 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold tracking-[0.15em] text-sage">PAGE EDIT</p>
              {!isPro && aiRemaining != null && (
                <p className="text-[10px] text-ink-faint">이번 달 {aiRemaining}/{AI_EDIT_FREE_MONTHLY_LIMIT}회 남음</p>
              )}
            </div>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              지금 쓴 원고의 문장만 다듬어요. 사실과 내용은 바꾸지 않고, 적용 전에 원문과 비교할 수 있어요.
            </p>
            <button
              type="button"
              disabled={aiEditing || saving || regenerating}
              className="mt-4 min-h-11 border-b border-ink text-sm font-semibold disabled:opacity-40"
              onClick={() => void requestAiEdit(content)}
            >
              {aiEditing ? 'PAGE가 원고를 다듬고 있어요...' : 'PAGE에게 다듬기 맡기기 →'}
            </button>
          </section>
        )}

        <section className={[aiEditEnabled ? 'mt-5' : 'mt-8', 'border-y border-border py-5'].join(' ')}>
          <p className="text-[9px] font-semibold tracking-[0.15em] text-sage">AI EDITOR</p>
          <p className="mt-2 text-xs leading-5 text-ink-muted">
            원본 기록을 다시 읽고 챕터 초안을 새로 만들 수 있어요. 현재 직접 수정한 내용은 교체됩니다.
          </p>
          <button
            type="button"
            disabled={regenerating || saving}
            className="mt-4 min-h-11 border-b border-ink text-sm font-semibold disabled:opacity-40"
            onClick={() => setConfirmOpen(true)}
          >
            {regenerating ? '원고를 다시 구성하고 있어요...' : 'AI로 다시 구성하기 →'}
          </button>
        </section>
      </main>

      <div className="border-t border-border bg-surface px-5 py-4 safe-bottom">
        <Button disabled={saving || regenerating || !canSave} onClick={() => void handleSave()}>
          {saving ? '저장 중...' : '편집 내용 저장하기'}
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="원고를 다시 구성할까요?">
        <p className="mb-6 text-center text-sm leading-6 text-ink-muted">
          PAGE가 원본 기록부터 다시 읽고 새 초안을 만들어요.
          <br />
          지금 수정한 원고는 교체됩니다.
        </p>
        <Button onClick={() => void handleRegenerate()}>다시 구성하기</Button>
        <Button variant="ghost" className="mt-2" onClick={() => setConfirmOpen(false)}>취소</Button>
      </Modal>

      <Modal open={leaveConfirmOpen} onClose={() => setLeaveConfirmOpen(false)} title="저장하지 않고 나갈까요?">
        <p className="mb-5 text-sm leading-6 text-ink-muted">고친 제목과 원고가 사라져요.</p>
        <Button
          onClick={() => {
            setLeaveConfirmOpen(false)
            void handleSave()
          }}
        >
          저장하고 나가기
        </Button>
        <Button variant="secondary" className="mt-2" onClick={leave}>저장하지 않고 나가기</Button>
        <Button variant="ghost" className="mt-2" onClick={() => setLeaveConfirmOpen(false)}>계속 편집</Button>
      </Modal>

      <Modal open={Boolean(aiResult)} onClose={() => setAiResult(null)} title="PAGE가 다듬은 원고">
        {aiResult && (
          <div>
            {aiResult.notes.length > 0 && (
              <ul className="mb-4 border-l-2 border-sage pl-3 text-xs leading-5 text-ink-muted">
                {aiResult.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
            <div className="flex border-b border-border">
              {(['edited', 'original'] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  className={[
                    'min-h-11 flex-1 border-b-2 text-xs font-semibold',
                    aiView === view ? 'border-ink text-ink' : 'border-transparent text-ink-faint',
                  ].join(' ')}
                  onClick={() => setAiView(view)}
                >
                  {view === 'edited' ? '다듬은 원고' : '원문'}
                </button>
              ))}
            </div>
            <div className="max-h-[42vh] overflow-y-auto whitespace-pre-wrap py-4 font-serif text-[15px] leading-7 text-ink">
              {aiView === 'edited' ? aiResult.text : aiSource}
            </div>
            <Button className="mt-2" onClick={applyAiEdit}>이 버전 사용하기</Button>
            <Button
              variant="secondary"
              className="mt-2"
              disabled={aiEditing}
              onClick={() => void requestAiEdit(aiSource)}
            >
              {aiEditing
                ? '다시 다듬는 중...'
                : !isPro && aiRemaining != null
                  ? `다시 다듬기 (${aiRemaining}회 남음)`
                  : '다시 다듬기'}
            </Button>
            <Button variant="ghost" className="mt-2" onClick={() => setAiResult(null)}>원문 유지</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
