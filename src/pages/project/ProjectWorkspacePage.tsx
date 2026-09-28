import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, ProgressBar } from '@/components/common'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { useActiveProject } from '@/hooks/useActiveProject'
import { listChapters } from '@/lib/api/chapters'
import { listRecords } from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'

export function ProjectWorkspacePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { project, loading: projectLoading } = useActiveProject()
  const [recordCount, setRecordCount] = useState(0)
  const [chapterCount, setChapterCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !project) return
    void Promise.all([
      listRecords(user.id, { projectId: project.id }),
      listChapters(project.id),
    ]).then(([records, chapters]) => {
      setRecordCount(records.length)
      setChapterCount(chapters.length)
      setLoading(false)
    })
  }, [user, project])

  if (projectLoading || loading || !project) return <div className="flex min-h-dvh items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>

  const progress = Math.min(100, Math.round((recordCount / project.target_count) * 100))
  const typeLabel = PROJECT_TYPES.find((item) => item.type === project.type)?.label ?? '나의 이야기'
  const stages = [
    { label: '기록', description: recordCount + '개의 이야기가 쌓였어요', to: '/records', ready: true },
    { label: '챕터', description: chapterCount > 0 ? chapterCount + '개의 챕터를 다듬고 있어요' : '기록이 모이면 AI가 챕터를 제안해요', to: '/book', ready: recordCount > 0 },
    { label: '원고', description: '챕터를 하나의 책 흐름으로 다듬어요', to: '/book', ready: chapterCount > 0 },
    { label: '표지', description: '책의 첫인상을 완성해요', to: '/book/cover', ready: chapterCount > 0 },
    { label: '최종 검수', description: '제목·목차·원고를 마지막으로 확인해요', to: '/book', ready: chapterCount > 0 },
    { label: '발행', description: '완성된 책을 PDF로 간직해요', to: '/book/cover', ready: chapterCount > 0 },
  ]

  return (
    <div className="mx-auto min-h-dvh w-full max-w-phone overflow-y-auto bg-surface">
      <header className="px-5 pb-4 pt-6">
        <button className="text-sm text-ink-muted" onClick={() => navigate('/library')}>← 내 서재</button>
        <p className="mt-6 text-xs font-semibold tracking-[0.18em] text-sage">BOOK WORKSPACE</p>
        <h1 className="mt-1 font-serif text-2xl font-bold">{project.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{typeLabel}</p>
      </header>
      <main className="px-5 pb-8">
        <Card className="paper-card p-5">
          <div className="flex items-end justify-between"><div><p className="text-xs text-ink-muted">책 완성도</p><p className="mt-1 text-sm font-semibold">{recordCount}/{project.target_count}개의 기록</p></div><p className="font-serif text-3xl font-bold">{progress}%</p></div>
          <ProgressBar value={progress} className="mt-3" />
          <button className="mt-5 w-full rounded-btn bg-accent px-4 py-3.5 text-sm font-semibold text-white" onClick={() => navigate('/record/mode')}>+ 오늘 기록하기</button>
        </Card>
        <section className="mt-6">
          <p className="mb-3 font-serif text-base font-bold">이 책을 완성하는 과정</p>
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <button key={stage.label} disabled={!stage.ready} onClick={() => navigate(stage.to)} className={['flex w-full items-center gap-4 rounded-card border p-4 text-left', stage.ready ? 'border-border bg-surface-card shadow-paper' : 'border-border bg-surface-alt/50 opacity-55'].join(' ')}>
                <span className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold', stage.ready ? 'bg-accent text-white' : 'bg-surface-alt text-ink-faint'].join(' ')}>{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="font-serif text-sm font-bold">{stage.label}</p><p className="mt-1 text-[11px] text-ink-muted">{stage.description}</p></div>
                <span className="text-ink-faint">›</span>
              </button>
            ))}
          </div>
        </section>
        <Card className="mt-6 p-4">
          <div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light font-serif font-bold">P</div><div><p className="text-sm font-semibold">PAGE의 편집 메모</p><p className="mt-1 text-xs leading-relaxed text-ink-muted">지금은 완성보다 재료를 모으는 시간이에요. 기록이 쌓일수록 책의 흐름이 선명해져요.</p></div></div>
        </Card>
      </main>
    </div>
  )
}
