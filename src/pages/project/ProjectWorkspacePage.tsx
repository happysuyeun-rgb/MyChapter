import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgressBar } from '@/components/common'
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
      <header className="px-5 pb-6 pt-6">
        <button className="flex min-h-11 items-center text-sm text-ink-muted" onClick={() => navigate('/library')}>← 내 서재</button>
        <div className="mt-6 flex gap-5 border-b border-ink pb-6">
          <div className="flex h-28 w-[74px] shrink-0 flex-col justify-between rounded-r-md rounded-l-[3px] bg-ink p-3 text-surface shadow-[7px_8px_0_rgba(59,53,45,.10)]">
            <span className="text-[6px] tracking-[0.18em] opacity-55">MY CHAPTER</span>
            <span className="line-clamp-4 font-serif text-[10px] font-bold leading-[1.5]">{project.title}</span>
            <span className="h-px w-5 bg-sage" />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-sage">BOOK WORKSPACE</p>
            <h1 className="mt-2 line-clamp-2 font-serif text-[24px] font-bold leading-snug tracking-[-0.03em]">{project.title}</h1>
            <p className="mt-2 text-xs text-ink-muted">{typeLabel} · 기록 {recordCount}개</p>
          </div>
        </div>
      </header>
      <main className="px-5 pb-8">
        <section className="border-y border-border py-5">
          <div className="flex items-end justify-between"><div><p className="text-xs text-ink-muted">이야기 준비도</p><p className="mt-1 text-sm font-semibold">{readiness.message}</p></div><p className="font-serif text-3xl font-bold">{progress}%</p></div>
          <ProgressBar value={progress} className="mt-3" />
          <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{readiness.isReady ? `기록 ${recordCount}개 · ${readiness.elapsedDays}일 동안 이야기를 모았어요.` : `기록 ${recordCount}/${readiness.rule.minRecords}개 · ${readiness.elapsedDays}/${readiness.rule.minDays}일 · 책 만들기까지 ${readiness.recordsRemaining > 0 ? `기록 ${readiness.recordsRemaining}개` : ''}${readiness.recordsRemaining > 0 && readiness.daysRemaining > 0 ? ' · ' : ''}${readiness.daysRemaining > 0 ? `${readiness.daysRemaining}일` : ''}`}</p>
          <button className="mt-5 min-h-[48px] w-full border border-ink bg-ink px-4 py-3.5 text-sm font-semibold text-surface" onClick={() => navigate('/record/mode')}>+ 오늘 기록하기</button>
        </section>
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-semibold tracking-[0.16em] text-sage">PRODUCTION</p><p className="mt-1 font-serif text-base font-bold">이 책을 완성하는 과정</p></div><span className="font-serif text-xs text-ink-faint">01 — 06</span></div>
          <div className="border-t border-border">
            {stages.map((stage, index) => (
              <button key={stage.label} disabled={!stage.ready} onClick={() => navigate(stage.to)} className={['flex w-full items-center gap-4 border-b border-border py-4 text-left', stage.ready ? 'bg-transparent' : 'opacity-45'].join(' ')}>
                <span className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold', stage.ready ? 'bg-accent text-white' : 'bg-surface-alt text-ink-faint'].join(' ')}>{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="font-serif text-sm font-bold">{stage.label}</p><p className="mt-1 text-[11px] text-ink-muted">{stage.description}</p></div>
                <span className="text-ink-faint">›</span>
              </button>
            ))}
          </div>
        </section>
        <section className="mt-8 border-t border-border pt-5">
          <div className="flex gap-3"><div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-[#D8CCB9] bg-[#FFF9EE] shadow-sm"><span className="absolute -top-1 left-4 h-2 w-1 rotate-[-28deg] rounded-full bg-sage" /><span className="absolute -top-1 right-2 h-1.5 w-2 rotate-[25deg] rounded-full bg-sage" /><span className="font-serif text-[9px] font-bold tracking-[0.1em]">PAGE</span></div><div><p className="text-sm font-semibold">PAGE의 편집 메모</p><p className="mt-1 text-xs leading-relaxed text-ink-muted">{readiness.isReady ? '이제 기록을 챕터와 원고로 발전시킬 수 있어요.' : '지금은 완성보다 재료를 모으는 시간이에요. 기간과 기록이 함께 쌓이면 책 만들기가 열려요.'}</p></div></div>
        </section>
      </main>
    </div>
  )
}
