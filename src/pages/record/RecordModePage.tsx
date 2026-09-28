import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlatIcon } from '@/components/common'
import { useActiveProject } from '@/hooks/useActiveProject'
import { getRecordCount } from '@/lib/api/records'
import type { RecordModeInstance } from '@/types/database'

const MODES: {
  value: RecordModeInstance
  index: string
  title: string
  description: string
  note: string
}[] = [
  {
    value: 'question',
    index: '01',
    title: 'PAGE에게 질문 받기',
    description: '지금까지의 기록을 바탕으로 오늘 꺼내볼 이야기를 PAGE가 질문해요.',
    note: 'AI QUESTION',
  },
  {
    value: 'free',
    index: '02',
    title: '빈 페이지에서 시작하기',
    description: '형식 없이 오늘 기억하고 싶은 장면과 생각을 그대로 적어요.',
    note: 'FREE WRITING',
  },
  {
    value: 'photo',
    index: '03',
    title: '한 장면으로 남기기',
    description: '사진 한 장과 짧은 문장으로 오늘의 순간을 한 페이지에 담아요.',
    note: 'PHOTO NOTE',
  },
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
    if (project) void getRecordCount(project.id).then((count) => setRecordNumber(count + 1))
  }, [project])

  if (loading || !project) {
    return <div className="flex min-h-dvh items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <header className="px-5 pb-6 pt-6">
        <button type="button" className="flex min-h-11 items-center text-sm text-ink-muted" onClick={() => navigate(-1)}>
          ← 돌아가기
        </button>

        <div className="mt-7 flex items-end justify-between border-b border-ink pb-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-sage">
              PAGE {String(recordNumber).padStart(2, '0')}
            </p>
            <h1 className="mt-3 font-serif text-[29px] font-bold leading-[1.32] tracking-[-0.03em]">
              오늘의 페이지를
              <br />
              어떻게 시작할까요?
            </h1>
          </div>
          <FlatIcon name="pen" size={30} className="mb-1 text-ink" />
        </div>

        <p className="mt-4 text-xs leading-5 text-ink-muted">
          <span className="font-semibold text-ink">{project.title}</span>에 새로운 페이지가 더해집니다.
        </p>
      </header>

      <main className="flex-1 px-5 pb-8">
        <div className="border-t border-border">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => navigate(ROUTES[mode.value])}
              className="group flex w-full gap-4 border-b border-border py-5 text-left active:bg-accent-light/40"
            >
              <span className="w-7 shrink-0 pt-1 font-serif text-xs text-ink-faint">{mode.index}</span>
              <span className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold tracking-[0.16em] text-sage">{mode.note}</span>
                <span className="mt-1.5 block font-serif text-[17px] font-bold tracking-[-0.02em]">{mode.title}</span>
                <span className="mt-2 block text-xs leading-5 text-ink-muted">{mode.description}</span>
              </span>
              <span className="pt-5 text-lg text-ink-faint transition-transform group-active:translate-x-1">→</span>
            </button>
          ))}
        </div>

        <div className="mt-7 border-l-2 border-sage pl-4">
          <p className="text-xs font-semibold">어떤 방식을 골라도 원본은 그대로 보관해요.</p>
          <p className="mt-1 text-[11px] leading-5 text-ink-muted">
            기록 방식은 매번 바꿀 수 있고, PAGE의 편집은 원본 위에 새로운 결과를 만드는 방식으로 진행됩니다.
          </p>
        </div>
      </main>
    </div>
  )
}
