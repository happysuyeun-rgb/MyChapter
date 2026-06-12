import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common'
import { ModeSelectCard } from '@/components/features/project/ModeSelectCard'
import { NavBar } from '@/components/layout/NavBar'
import { useActiveProject } from '@/hooks/useActiveProject'
import { getRecordCount } from '@/lib/api/records'
import type { RecordModeInstance } from '@/types/database'

const MODES: {
  value: RecordModeInstance
  emoji: string
  title: string
  description: string
}[] = [
  { value: 'question', emoji: '💬', title: '오늘의 질문 답하기', description: '평균 2분' },
  { value: 'photo', emoji: '📸', title: '사진 + 한줄 캡션', description: '평균 1분' },
  { value: 'free', emoji: '✍️', title: '자유 일기', description: '평균 5~10분' },
]

const ROUTES: Record<RecordModeInstance, string> = {
  question: '/record/write/question',
  photo: '/record/write/photo',
  free: '/record/write/free',
}

export function RecordModePage() {
  const navigate = useNavigate()
  const { project, loading } = useActiveProject()
  const [selected, setSelected] = useState<RecordModeInstance>('question')
  const [recordNumber, setRecordNumber] = useState(1)

  useEffect(() => {
    if (project) {
      void getRecordCount(project.id).then((c) => setRecordNumber(c + 1))
    }
  }, [project])

  if (loading || !project) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar
        title={`오늘의 기록 #${recordNumber}`}
        leftLabel="←"
      />
      <div className="flex-1 p-5 pt-6">
        <p className="mb-5 text-sm text-ink-muted">오늘은 어떻게 기록할까요?</p>
        {MODES.map((mode) => (
          <ModeSelectCard
            key={mode.value}
            emoji={mode.emoji}
            title={mode.title}
            description={mode.description}
            active={selected === mode.value}
            onClick={() => setSelected(mode.value)}
          />
        ))}
      </div>
      <div className="p-5">
        <Button onClick={() => navigate(ROUTES[selected])}>
          선택한 모드로 시작
        </Button>
      </div>
    </div>
  )
}
