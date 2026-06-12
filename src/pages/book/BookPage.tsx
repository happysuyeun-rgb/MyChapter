import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, EmptyState, ProgressBar } from '@/components/common'
import { useActiveProject } from '@/hooks/useActiveProject'
import {
  ChapterApiError,
  generateChapter,
  getUnassignedRecordCount,
  listChapters,
} from '@/lib/api/chapters'
import { getSubscriptionPlan } from '@/lib/api/subscriptions'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import type { Chapter } from '@/types/database'
import { estimateChapterPages } from '@/utils/chapterContent'

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

  const load = useCallback(async () => {
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
  }, [user, project])

  useEffect(() => {
    if (projectLoading) return
    if (!project) {
      setLoading(false)
      return
    }

    setLoading(true)
    void load()
  }, [project, projectLoading, load])

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
        <p className="mb-3 text-xs font-semibold text-ink-muted">완성된 챕터</p>
        {chapters.length === 0 ? (
          <p className="text-sm text-ink-muted">아직 완성된 챕터가 없어요.</p>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                className="w-full rounded-card border border-border bg-white p-4 text-left transition-colors active:bg-surface-alt"
                onClick={() => navigate(`/book/chapter/${chapter.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-ink-faint">Chapter {chapter.chapter_number}</p>
                    <p className="mt-1 font-semibold">{chapter.title}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      기록 {chapter.record_ids.length}개 · 약 {estimateChapterPages(chapter.record_ids.length)}페이지
                    </p>
                  </div>
                  <span className="text-ink-faint">›</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {chapters.length > 0 && (
        <div className="border-t border-border px-5 py-4">
          <Button onClick={() => navigate('/book/cover')}>책 출판하기</Button>
        </div>
      )}
    </div>
  )
}
