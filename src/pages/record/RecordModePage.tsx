import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveProject } from '@/hooks/useActiveProject'
import { getRecordCount } from '@/lib/api/records'
import type { RecordModeInstance } from '@/types/database'

const MODES: { value: RecordModeInstance; symbol: string; title: string; description: string }[] = [
  { value: 'question', symbol: '✦', title: 'AI 질문으로 기록', description: 'PAGE가 지금의 이야기를 꺼낼 수 있도록 질문해드려요.' },
  { value: 'free', symbol: '✎', title: '자유롭게 기록', description: '형식 없이 오늘의 생각과 장면을 편하게 적어요.' },
  { value: 'photo', symbol: '▧', title: '사진으로 기록', description: '한 장의 사진과 짧은 문장으로 순간을 남겨요.' },
]

const ROUTES: Record<RecordModeInstance, string> = {
  question: '/record/write/question',
  photo: '/record/write/photo',
  free: '/record/write/free',
}

export function RecordModePage() {
  const navigate = useNavigate()
  const { project, loading } = useActiveProject()
  const [recordNumber, setRecordNumber] = useState(1)

  useEffect(() => {
    if (project) void getRecordCount(project.id).then((c) => setRecordNumber(c + 1))
  }, [project])

  if (loading || !project) return <div className="flex min-h-dvh items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <header className="px-5 pb-5 pt-6">
        <button type="button" className="text-sm text-ink-muted" onClick={() => navigate(-1)}>← 돌아가기</button>
        <p className="mt-7 text-xs font-semibold tracking-[0.18em] text-sage">PAGE {String(recordNumber).padStart(2, '0')}</p>
        <h1 className="mt-2 font-serif text-2xl font-bold">오늘은 어떻게<br />기록해볼까요?</h1>
        <p className="mt-2 text-sm text-ink-muted">{project.title}에 오늘의 이야기가 한 페이지 더해져요.</p>
      </header>
      <main className="space-y-3 px-5 pb-8">
        {MODES.map((mode, index) => (
          <button key={mode.value} type="button" onClick={() => navigate(ROUTES[mode.value])} className={['w-full rounded-card border p-5 text-left shadow-paper transition-transform active:scale-[.99]', index === 0 ? 'border-accent bg-accent text-white' : 'border-border bg-surface-card text-ink'].join(' ')}>
            <div className="flex items-start gap-4">
              <span className={['flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl', index === 0 ? 'bg-white/10' : 'bg-accent-light text-accent'].join(' ')}>{mode.symbol}</span>
              <div><p className="font-serif text-base font-bold">{mode.title}</p><p className={['mt-1.5 text-xs leading-relaxed', index === 0 ? 'text-white/70' : 'text-ink-muted'].join(' ')}>{mode.description}</p></div>
            </div>
          </button>
        ))}
        <p className="px-2 pt-3 text-center text-[11px] leading-relaxed text-ink-faint">기록 방식은 매번 자유롭게 선택할 수 있어요.<br />원본 기록은 언제나 그대로 보관됩니다.</p>
      </main>
    </div>
  )
}
