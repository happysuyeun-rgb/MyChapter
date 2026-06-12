import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, EmptyState, ProgressBar } from '@/components/common'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { getUnreadCount } from '@/lib/api/notifications'
import { generateQuestion, getTodayQuestion } from '@/lib/api/questions'
import { getProjects } from '@/lib/api/projects'
import { listRecords } from '@/lib/api/records'
import { calculateStreak, getNextStreakGoal } from '@/utils/streak'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@/types/database'

export function HomePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { setActiveProject } = useProjectStore()
  const { isPro } = useSubscription()
  const [projects, setProjects] = useState<Project[]>([])
  const [recordCount, setRecordCount] = useState(0)
  const [todayQuestion, setTodayQuestion] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const projectData = await getProjects(user.id)
      setProjects(projectData)

      if (projectData[0]) {
        setActiveProject(projectData[0])

        const allRecords = await listRecords(user.id, {
          projectId: projectData[0].id,
        })
        setRecordCount(allRecords.length)
        setStreak(calculateStreak(allRecords))

        const cached = await getTodayQuestion(projectData[0].id)
        if (cached) {
          setTodayQuestion(cached)
        } else {
          const question = await generateQuestion(projectData[0].id)
          setTodayQuestion(question)
        }
      }

      const unread = await getUnreadCount(user.id)
      setUnreadCount(unread)
      setLoading(false)
    }

    void load()
  }, [user, setActiveProject])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  if (projects.length === 0) {
    return <EmptyState variant="home" />
  }

  const project = projects[0]
  const typeLabel = PROJECT_TYPES.find((p) => p.type === project.type)?.label ?? '진행 중'
  const progress = Math.min(
    100,
    Math.round((recordCount / project.target_count) * 100),
  )
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-5 pt-5">
        <div>
          <p className="text-xs text-ink-faint">{today}</p>
          <h1 className="mt-0.5 text-lg font-bold">
            안녕하세요, {profile?.nickname ?? '회원'}님 👋
          </h1>
        </div>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent-light text-lg"
          onClick={() => navigate('/notifications')}
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white" />
          )}
        </button>
      </div>

      <div className="px-5 pt-4">
        <Card className="flex items-center gap-3 p-3.5">
          <span className="text-[28px]">🔥</span>
          <div>
            {streak >= 2 ? (
              <>
                <p className="font-bold">{streak}일 연속 기록 중</p>
                <p className="text-sm text-ink-muted">
                  {getNextStreakGoal(streak) ?? '오늘도 기록해보세요'}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold">기록을 이어가 보세요</p>
                <p className="text-sm text-ink-muted">오늘도 한 줄이면 충분해요</p>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="px-5 pt-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[13px] font-semibold">진행 중인 프로젝트</span>
          {isPro && projects.length > 1 && (
            <button
              type="button"
              className="text-xs text-accent"
              onClick={() => navigate('/projects')}
            >
              전체보기
            </button>
          )}
        </div>
        <Card accent className="p-[18px]">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-[15px] font-bold">{project.title}</p>
              <p className="text-xs text-accent">{typeLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-extrabold text-accent">{progress}%</p>
              <p className="text-[11px] text-ink-faint">완성</p>
            </div>
          </div>
          <ProgressBar value={progress} className="mb-2.5" />
          <div className="flex justify-between text-[11px] text-ink-faint">
            <span>
              {recordCount}/{project.target_count}개 기록
            </span>
            <span>완성까지 {Math.max(0, project.target_count - recordCount)}개</span>
          </div>
        </Card>
      </div>

      <div className="px-5 pt-4 pb-5">
        <p className="mb-2.5 text-[13px] font-semibold">오늘의 AI 질문</p>
        <Card className="p-[18px]">
          <p className="mb-3.5 text-sm leading-relaxed">
            &quot;{todayQuestion ?? '오늘의 질문을 불러오는 중...'}&quot;
          </p>
          <button
            type="button"
            className="w-full rounded-[10px] bg-accent py-3 text-center text-sm font-semibold text-white"
            onClick={() => {
              if (project.record_mode === 'daily') {
                navigate('/record/mode')
              } else if (project.record_mode === 'photo') {
                navigate('/record/write/photo')
              } else if (project.record_mode === 'free') {
                navigate('/record/write/free')
              } else {
                navigate('/record/write/question')
              }
            }}
          >
            지금 답하기 ✍️
          </button>
        </Card>
      </div>
    </div>
  )
}
