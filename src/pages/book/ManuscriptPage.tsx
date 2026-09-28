import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common'
import { useActiveProject } from '@/hooks/useActiveProject'
import { listChapters } from '@/lib/api/chapters'
import { listRecords } from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'
import type { Chapter } from '@/types/database'
import { getBookReadiness } from '@/utils/bookReadiness'
import { getChapterDisplayContent } from '@/utils/chapterContent'

export function ManuscriptPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { project, loading: projectLoading } = useActiveProject()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [recordCount, setRecordCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !project) return
    void Promise.all([
      listChapters(project.id),
      listRecords(user.id, { projectId: project.id }),
    ]).then(([chapterData, records]) => {
      const readiness = getBookReadiness(project, records.length)
      if (!readiness.isReady) {
        navigate('/project/workspace', { replace: true })
        return
      }
      setChapters(chapterData)
      setRecordCount(records.length)
      setLoading(false)
    })
  }, [user, project, navigate])

  const manuscriptChars = useMemo(
    () => chapters.reduce((sum, chapter) => sum + getChapterDisplayContent(chapter).length, 0),
    [chapters],
  )
  const completedChapters = chapters.filter((chapter) => getChapterDisplayContent(chapter).trim().length > 0).length
  const manuscriptReady = chapters.length > 0 && completedChapters === chapters.length

  if (projectLoading || loading || !project) {
    return <div className="flex min-h-dvh items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-phone overflow-y-auto bg-surface">
      <header className="px-5 pb-4 pt-6">
        <button className="text-sm text-ink-muted" onClick={() => navigate('/book')}>← 챕터</button>
        <p className="mt-6 text-xs font-semibold tracking-[0.18em] text-sage">MANUSCRIPT</p>
        <h1 className="mt-1 font-serif text-2xl font-bold">한 권의 원고로 다듬기</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">AI가 만든 챕터 초안을 읽고, 내 목소리가 살아 있도록 각 장을 직접 다듬어주세요.</p>
      </header>

      <main className="px-5 pb-8">
        <section className="border-y border-border py-5">
          <div className="flex items-end justify-between">
            <div><p className="text-xs text-ink-muted">원고 상태</p><p className="mt-1 font-serif text-lg font-bold">{completedChapters}/{chapters.length} 챕터 확인</p></div>
            <p className="text-xs text-ink-muted">약 {manuscriptChars.toLocaleString()}자</p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">기록 {recordCount}개에서 만들어진 원고예요. 원본 기록은 그대로 보존됩니다.</p>
        </section>

        <section className="mt-8">
          <p className="mb-3 font-serif text-base font-bold">원고 목차</p>
          <div className="border-t border-border">
            {chapters.map((chapter) => {
              const content = getChapterDisplayContent(chapter)
              return (
                <article key={chapter.id} className="border-b border-border py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-ink-faint">{String(chapter.chapter_number).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-sm font-bold">{chapter.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">{content || '아직 원고가 없어요.'}</p>
                      <div className="mt-3 flex gap-4">
                        <button className="text-xs font-semibold text-sage" onClick={() => navigate('/book/chapter/' + chapter.id)}>읽어보기</button>
                        <button className="text-xs font-semibold text-accent" onClick={() => navigate('/book/chapter/' + chapter.id + '/edit')}>원고 편집</button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {chapters.length === 0 ? (
          <section className="mt-7 border-y border-ink py-6">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-sage">MANUSCRIPT EMPTY</p>
            <p className="mt-3 font-serif text-lg font-bold">먼저 챕터를 만들어주세요.</p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">기록을 챕터로 구성한 뒤 한 권의 원고 흐름을 다듬을 수 있어요.</p>
            <Button className="mt-5" onClick={() => navigate('/book')}>챕터 만들기</Button>
          </section>
        ) : (
          <div className="mt-6">
            <Button disabled={!manuscriptReady} onClick={() => navigate('/book/cover')}>원고 확인 완료 · 표지 선택하기</Button>
            {!manuscriptReady && <p className="mt-2 text-center text-xs text-ink-muted">모든 챕터에 원고가 있어야 다음 단계로 갈 수 있어요.</p>}
          </div>
        )}
      </main>
    </div>
  )
}
