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
import { Button, EmptyState, ProgressBar } from '@/components/common'
import { useActiveProject } from '@/hooks/useActiveProject'
import {
  ChapterApiError,
  generateChapter,
  getUnassignedRecordCount,
  listChapters,
  reorderChapters,
} from '@/lib/api/chapters'
import { useAuthStore } from '@/stores/authStore'
import type { Chapter } from '@/types/database'
import { estimateChapterPages } from '@/utils/chapterContent'
import { getBookReadiness } from '@/utils/bookReadiness'

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
        'flex items-stretch gap-2 border-b border-border bg-transparent',
        editMode ? 'border-l-2 border-l-sage' : '',
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

  const [chapters, setChapters] = useState<Chapter[]>([])
  const [unassignedCount, setUnassignedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [generationError, setGenerationError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const load = async () => {
    if (!user || !project) return

    const [chapterData, pending] = await Promise.all([
      listChapters(project.id),
      getUnassignedRecordCount(project.id),
    ])

    setChapters(chapterData)
    setUnassignedCount(pending)
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
    setGenerationError('')

    try {
      const chapter = await generateChapter(project.id)
      if (chapter) {
        await load()
      }
    } catch (error) {
      setGenerationError(
        error instanceof ChapterApiError
          ? error.message
          : '챕터를 만들지 못했어요. 잠시 후 다시 시도해주세요.',
      )
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

  const totalRecords = chapters.reduce((sum, ch) => sum + ch.record_ids.length, 0) + unassignedCount
  const readiness = getBookReadiness(project, totalRecords)

  if (!readiness.isReady) {
    return (
      <div className="flex flex-1 flex-col bg-surface px-5 py-6">
        <button className="self-start text-sm text-ink-muted" onClick={() => navigate('/project/workspace')}>← 책 작업실</button>
        <section className="mt-8 border-y border-ink py-7">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">STORY READINESS</p>
          <h1 className="mt-3 font-serif text-[25px] font-bold leading-snug">아직 이야기를 모으고 있어요</h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">{readiness.message}</p>
          <div className="mt-6 flex items-end justify-between">
            <span className="text-[10px] tracking-[0.12em] text-ink-faint">READINESS</span>
            <span className="font-serif text-[34px] font-bold">{readiness.score}%</span>
          </div>
          <ProgressBar value={readiness.score} className="mt-2" />
          <p className="mt-3 text-[11px] leading-5 text-ink-muted">기록 {totalRecords}/{readiness.rule.minRecords}개 · {readiness.elapsedDays}/{readiness.rule.minDays}일</p>
          <Button className="mt-6" onClick={() => navigate('/record/mode')}>오늘 한 페이지 이어가기</Button>
        </section>
      </div>
    )
  }

  if (chapters.length === 0 && unassignedCount === 0) {
    return <EmptyState variant="book" />
  }

  const canGenerate = unassignedCount >= 3
  const progress = readiness.score

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-surface">
      <header className="px-5 pb-5 pt-6">
        <div className="border-b border-ink pb-5">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">CHAPTER DESK</p>
          <h1 className="mt-2 font-serif text-[25px] font-bold tracking-[-0.03em]">{project.title}</h1>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
            <span>챕터 {chapters.length}개 · 기록 {totalRecords}개</span>
            <span className="font-serif font-bold text-ink">{progress}%</span>
          </div>
          <ProgressBar value={progress} className="mt-3" />
        </div>
      </header>

      {unassignedCount > 0 && (
        <section className="mx-5 mt-5 border-y border-border py-4">
          <p className="text-sm font-semibold">{chapters.length === 0 ? 'PAGE가 첫 챕터의 연결점을 찾을 준비가 됐어요' : '아직 챕터에 담지 않은 기록이 있어요'}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            남은 기록 {unassignedCount}개를 날짜순으로 자르지 않고, 반복되는 주제와 변화의 흐름을 찾아 서로 연결되는 기록끼리 묶어요.
          </p>
          {canGenerate && (
            <Button
              className="mt-4"
              disabled={generating}
              onClick={() => {
                void handleGenerate()
              }}
            >
              {generating ? '기록의 연결점을 찾고 있어요...' : chapters.length === 0 ? 'AI로 첫 챕터 구성하기' : 'AI로 다음 챕터 구성하기'}
            </Button>
          )}
          {!canGenerate && (
            <p className="mt-3 text-xs text-ink-faint">관련 기록이 3개 이상 모이면 다음 챕터를 구성할 수 있어요.</p>
          )}
          {generationError && <p className="mt-3 text-xs text-danger">{generationError}</p>}
        </section>
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
              <div className="border-t border-border">
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
          <Button onClick={() => navigate('/book/manuscript')}>원고 전체 확인하기</Button>
        </div>
      )}
    </div>
  )
}
