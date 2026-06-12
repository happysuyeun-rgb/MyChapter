import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common'
import { ModeSelectCard } from '@/components/features/project/ModeSelectCard'
import { NavBar } from '@/components/layout/NavBar'
import { createProject } from '@/lib/api/projects'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import type { RecordMode } from '@/types/database'

const MODE_OPTIONS: {
  value: RecordMode
  emoji: string
  title: string
  description: string
  badge?: string
}[] = [
  {
    value: 'question',
    emoji: '💬',
    title: '오늘의 질문 답하기',
    description: 'AI가 질문 1개를 던져요. 평균 2분.',
    badge: '추천',
  },
  {
    value: 'photo',
    emoji: '📸',
    title: '사진 + 한줄 캡션',
    description: '사진 1장 + 한 줄. 평균 1분.',
  },
  {
    value: 'free',
    emoji: '✍️',
    title: '자유 일기',
    description: '자유롭게 쓰기. 평균 5~10분.',
  },
  {
    value: 'daily',
    emoji: '🎛',
    title: '매일 선택할게요',
    description: '기록할 때마다 그날 기분으로',
  },
]

export function ProjectModePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { draft, setDraft, setCreatedProject, setActiveProject } = useProjectStore()
  const [selected, setSelected] = useState<RecordMode>(draft.recordMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!draft.type) {
      navigate('/project/new', { replace: true })
    }
  }, [draft.type, navigate])

  const handleStart = async () => {
    if (!user || !draft.type) return

    setLoading(true)
    setError('')

    try {
      const project = await createProject(user.id, {
        ...draft,
        recordMode: selected,
      })

      setDraft({ recordMode: selected })
      setCreatedProject(project)
      setActiveProject(project)
      navigate('/project/new/complete')
    } catch {
      setError('프로젝트 생성에 실패했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar title="기록 방식" leftLabel="←" />
      <div className="flex-1 overflow-y-auto p-5 pt-5">
        <h1 className="mb-1.5 text-lg font-bold leading-snug">
          기본 기록 방식을
          <br />
          선택해주세요
        </h1>
        <p className="mb-6 text-sm text-ink-muted">나중에 매일 바꿀 수 있어요</p>

        {MODE_OPTIONS.map((mode) => (
          <ModeSelectCard
            key={mode.value}
            emoji={mode.emoji}
            title={mode.title}
            description={mode.description}
            badge={mode.badge}
            active={selected === mode.value}
            onClick={() => setSelected(mode.value)}
          />
        ))}

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      <div className="p-5">
        <Button disabled={loading} onClick={() => void handleStart()}>
          {loading ? '생성 중...' : '프로젝트 시작!'}
        </Button>
      </div>
    </div>
  )
}
