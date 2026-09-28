import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Chip, Input } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { FREQUENCY_OPTIONS, NOTIFICATION_TIME_OPTIONS, PERIOD_OPTIONS } from '@/constants/projectOptions'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { createProject } from '@/lib/api/projects'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import { calculateRoutine, formatDateKo } from '@/utils/calculateRoutine'

export function ProjectSetupPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { draft, setDraft, setCreatedProject, setActiveProject } = useProjectStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const typeMeta = PROJECT_TYPES.find((p) => p.type === draft.type)

  useEffect(() => {
    if (!draft.type) navigate('/project/new', { replace: true })
  }, [draft.type, navigate])

  const routine = useMemo(
    () => calculateRoutine(draft.periodDays, draft.frequency),
    [draft.periodDays, draft.frequency],
  )

  if (!draft.type || !typeMeta) return null

  const handleStart = async () => {
    if (!user || !draft.title.trim()) return
    setLoading(true)
    setError('')
    try {
      const project = await createProject(user.id, { ...draft, recordMode: 'daily' })
      setDraft({ recordMode: 'daily' })
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
      <NavBar title={typeMeta.label} leftLabel="←" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-ink-faint">책 제목</label>
          <Input active value={draft.title} onChange={(e) => setDraft({ title: e.target.value })} placeholder="책 제목을 입력해주세요" className="mb-5" />

          <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-ink-faint">완성 목표 기간</label>
          <div className="mb-5 flex flex-wrap">
            {PERIOD_OPTIONS.map((opt) => <Chip key={opt.value} active={draft.periodDays === opt.value} onClick={() => setDraft({ periodDays: opt.value })}>{opt.label}</Chip>)}
          </div>

          <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-ink-faint">기록 주기</label>
          <div className="mb-5 flex flex-wrap">
            {FREQUENCY_OPTIONS.map((opt) => <Chip key={opt.value} active={draft.frequency === opt.value} onClick={() => setDraft({ frequency: opt.value })}>{opt.label}</Chip>)}
          </div>

          <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-ink-faint">알림 시간</label>
          <div className="mb-6 flex flex-wrap">
            {NOTIFICATION_TIME_OPTIONS.map((opt) => <Chip key={opt.value} active={draft.notificationTime === opt.value} onClick={() => setDraft({ notificationTime: opt.value })}>{opt.label}</Chip>)}
          </div>

          <Card accent className="p-4">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-accent">AI 루틴 예측</p>
            <div className="flex justify-between py-1 text-sm"><span className="text-ink-muted">필요한 기록 수</span><span className="font-bold text-accent">{routine.targetCount}개</span></div>
            <div className="flex justify-between py-1 text-sm"><span className="text-ink-muted">예상 페이지</span><span className="font-bold">약 {routine.estimatedPages}p</span></div>
            <div className="flex justify-between py-1 text-sm"><span className="text-ink-muted">예상 완성일</span><span className="font-bold">{formatDateKo(routine.targetDate)}</span></div>
          </Card>
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">기록할 때마다 AI 질문, 사진 기록, 자유 기록 중 원하는 방식을 선택할 수 있어요.</p>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </div>
      </div>

      <div className="p-5">
        <Button disabled={!draft.title.trim() || loading} onClick={() => void handleStart()}>
          {loading ? '생성 중...' : '프로젝트 시작하기'}
        </Button>
      </div>
    </div>
  )
}
