import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Card, EmptyState, ProgressBar } from '@/components/common'
import { useActiveProject } from '@/hooks/useActiveProject'
import {
  ChapterApiError,
  generateChapter,
  getUnassignedRecordCount,
  listChapters,
  reorderChapters,
} from '@/lib/api/chapters'
import { getSubscriptionPlan } from '@/lib/api/subscriptions'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import type { Chapter } from '@/types/database'
import { estimateChapterPages } from '@/utils/chapterContent'

function SortableChapterRow({
  chapter,
  editMode,
  onOpen,
}: {
  chapter: Chapter
  editMode: boolean
  onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
    disabled: !editMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-stretch gap-2 rounded-card border border-border bg-white',
        editMode ? 'border-accent/40' : '',
      ].join(' ')}
    >
      {editMode && (
        <button
          type="button"
          className="flex w-10 shrink-0 items-center justify-center text-ink-faint touch-none"
          aria-label="드래그하여 순서 변경"
          {...attributes}
          {...listeners}
        >
          ☰
        </button>
      )}
      <button
        type="button"
        className="min-w-0 flex-1 p-4 text-left transition-colors active:bg-surface-alt"
        onClick={editMode ? undefined : onOpen}
        disabled={editMode}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-ink-faint">Chapter {chapter.chapter_number}</p>
            <p className="mt-1 font-semibold">{chapter.title}</p>
            <p className="mt-1 text-xs text-ink-muted">
              기록 {chapter.record_ids.length}개 · 약 {estimateChapterPages(chapter.record_ids.length)}페이지
            </p>
          </div>
          {!editMode && <span className="text-ink-faint">›</span>}
        </div>
      </button>
    </div>
  )
}

export function BookPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { project, loading: projectLoading } = useActiveProject()
  const { showPaywall } = usePaywallStore()

  const [chapters, setChapters] = useState<Chapter[]>([])
  const [unassignedCount, setUnassignedCount] = useState(0)
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [reordering, setReordering] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const load = async () => {
    if (!user || !project) return

    const [chapterData, pending, plan] = await Promise.all([
      listChapters(project.id),
      getUnassignedRecordCount(project.id),
      getSubscriptionPlan(user.id),
    ])

    setChapters(chapterData)
    setUnassignedCount(pending)
    setIsPro(plan === 'pro')
    setLoading(false)
  }

  useEffect(() => {
    if (projectLoading) return
    if (!project) {
      setLoading(false)
      return
    }

    setLoading(true)
    void load()
  }, [project, projectLoading, user])

  const handleGenerate = async () => {
    if (!project) return
    setGenerating(true)

    try {
      const chapter = await generateChapter(project.id)
      if (chapter) {
        await load()
      }
    } catch (err) {
      if (err instanceof ChapterApiError && err.code === 'CHAPTER_LIMIT') {
        showPaywall()
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !project) return

    const oldIndex = chapters.findIndex((ch) => ch.id === active.id)
    const newIndex = chapters.findIndex((ch) => ch.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(chapters, oldIndex, newIndex)
    setChapters(reordered)
    setReordering(true)

    try {
      await reorderChapters(
        project.id,
        reordered.map((ch) => ch.id),
      )
    } catch {
      await load()
    } finally {
      setReordering(false)
    }
  }

  if (projectLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  if (!project) {
    return <EmptyState variant="book" />
  }

  if (chapters.length === 0 && unassignedCount === 0) {
    return <EmptyState variant="book" />
  }

  const canGenerate = unassignedCount >= 10
  const chapterLimitReached = !isPro && chapters.length >= 3 && unassignedCount >= 10
  const totalRecords = chapters.reduce((sum, ch) => sum + ch.record_ids.length, 0) + unassignedCount
  const progress = Math.min(100, Math.round((totalRecords / project.target_count) * 100))

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="border-b border-border px-5 py-4">
        <h1 className="text-lg font-bold">{project.title}</h1>
        <p className="mt-1 text-xs text-ink-muted">
          챕터 {chapters.length}개 · 기록 {totalRecords}개
        </p>
        <div className="mt-3">
          <ProgressBar value={progress} />
        </div>
      </div>

      {unassignedCount > 0 && (
        <Card className="mx-5 mt-4 p-4">
          <p className="text-sm font-semibold">진행 중인 챕터</p>
          <p className="mt-1 text-xs text-ink-muted">
            미할당 기록 {unassignedCount}/10개
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.min(100, (unassignedCount / 10) * 100)}%` }}
            />
          </div>
          {canGenerate && (
            <Button
              className="mt-4"
              disabled={generating}
              onClick={() => {
                if (chapterLimitReached) {
                  showPaywall()
                  return
                }
                void handleGenerate()
              }}
            >
              {generating
                ? '챕터 생성 중...'
                : chapterLimitReached
                  ? 'Pro로 챕터 더 만들기'
                  : '챕터 생성하기'}
            </Button>
          )}
          {chapterLimitReached && (
            <p className="mt-2 text-center text-xs text-ink-muted">
              Free 플랜은 챕터 3개까지예요
            </p>
          )}
        </Card>
      )}

      <div className="flex-1 px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-ink-muted">완성된 챕터</p>
          {chapters.length > 1 && (
            <button
              type="button"
              className="text-xs font-medium text-accent"
              onClick={() => setEditMode((prev) => !prev)}
            >
              {editMode ? '완료' : '순서 편집'}
            </button>
          )}
        </div>

        {editMode && (
          <p className="mb-3 text-xs text-ink-muted">
            {reordering ? '순서 저장 중...' : '챕터를 드래그해서 순서를 바꿀 수 있어요'}
          </p>
        )}

        {chapters.length === 0 ? (
          <p className="text-sm text-ink-muted">아직 완성된 챕터가 없어요.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
            <SortableContext items={chapters.map((ch) => ch.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <SortableChapterRow
                    key={chapter.id}
                    chapter={chapter}
                    editMode={editMode}
                    onOpen={() => navigate(`/book/chapter/${chapter.id}`)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {chapters.length > 0 && !editMode && (
        <div className="border-t border-border px-5 py-4">
          <Button onClick={() => navigate('/book/cover')}>책 출판하기</Button>
        </div>
      )}
    </div>
  )
}
