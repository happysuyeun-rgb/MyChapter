import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, ProgressBar } from '@/components/common'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { useActiveProject } from '@/hooks/useActiveProject'
import { listChapters } from '@/lib/api/chapters'
import { listRecords } from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'
import { getBookReadiness } from '@/utils/bookReadiness'

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

  const readiness = getBookReadiness(project, recordCount)
  const progress = readiness.score
  const typeLabel = PROJECT_TYPES.find((item) => item.type === project.type)?.label ?? '나의 이야기'
  const stages = [
    { label: '기록', description: recordCount + '개의 이야기가 쌓였어요', to: '/records', ready: true },
    { label: '챕터', description: readiness.isReady ? (chapterCount > 0 ? chapterCount + '개의 챕터를 다듬고 있어요' : '이야기가 충분히 모였어요. 챕터를 만들어보세요') : '이야기 준비도가 채워지면 열려요', to: '/book', ready: readiness.isReady },
    { label: '원고', description: '챕터를 하나의 책 흐름으로 다듬어요', to: '/book/manuscript', ready: readiness.isReady && chapterCount > 0 },
    { label: '표지', description: '책의 첫인상을 완성해요', to: '/book/cover', ready: readiness.isReady && chapterCount > 0 },
    { label: '최종 검수', description: '제목·목차·원고를 마지막으로 확인해요', to: '/book/review', ready: readiness.isReady && chapterCount > 0 },
    { label: '발행', description: '완성된 책을 PDF로 간직해요', to: '/book/review', ready: readiness.isReady && chapterCount > 0 },
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
          <div className="flex items-end justify-between"><div><p className="text-xs text-ink-muted">이야기 준비도</p><p className="mt-1 text-sm font-semibold">{readiness.message}</p></div><p className="font-serif text-3xl font-bold">{progress}%</p></div>
          <ProgressBar value={progress} className="mt-3" />
          <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{readiness.isReady ? `기록 ${recordCount}개 · ${readiness.elapsedDays}일 동안 이야기를 모았어요.` : `기록 ${recordCount}/${readiness.rule.minRecords}개 · ${readiness.elapsedDays}/${readiness.rule.minDays}일 · 책 만들기까지 ${readiness.recordsRemaining > 0 ? `기록 ${readiness.recordsRemaining}개` : ''}${readiness.recordsRemaining > 0 && readiness.daysRemaining > 0 ? ' · ' : ''}${readiness.daysRemaining > 0 ? `${readiness.daysRemaining}일` : ''}`}</p>
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
          <div className="flex gap-3"><div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-[#D8CCB9] bg-[#FFF9EE] shadow-sm"><span className="absolute -top-1 left-4 h-2 w-1 rotate-[-28deg] rounded-full bg-sage" /><span className="absolute -top-1 right-2 h-1.5 w-2 rotate-[25deg] rounded-full bg-sage" /><span className="font-serif text-[9px] font-bold tracking-[0.1em]">PAGE</span></div><div><p className="text-sm font-semibold">PAGE의 편집 메모</p><p className="mt-1 text-xs leading-relaxed text-ink-muted">{readiness.isReady ? '이제 기록을 챕터와 원고로 발전시킬 수 있어요.' : '지금은 완성보다 재료를 모으는 시간이에요. 기간과 기록이 함께 쌓이면 책 만들기가 열려요.'}</p></div></div>
        </Card>
      </main>
    </div>
  )
}
