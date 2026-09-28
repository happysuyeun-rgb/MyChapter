import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, ProgressBar } from '@/components/common'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { getProjects } from '@/lib/api/projects'
import { listRecords } from '@/lib/api/records'
import { useProjectLimit } from '@/hooks/useProjectLimit'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@/types/database'
import { getBookReadiness } from '@/utils/bookReadiness'

interface ProjectWithProgress extends Project {
  recordCount: number
  progress: number
  statusLabel: string
}

export function ProjectsListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { activeProject, setActiveProject } = useProjectStore()
  const { canCreate } = useProjectLimit()
  const { showPaywall } = usePaywallStore()
  const [projects, setProjects] = useState<ProjectWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'전체' | '진행중' | '발행가능' | '발행완료'>('전체')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const projectData = await getProjects(user.id)
      const withProgress = await Promise.all(projectData.map(async (project) => {
        const records = await listRecords(user.id, { projectId: project.id })
        const recordCount = records.length
        const readiness = getBookReadiness(project, recordCount)
        const progress = readiness.score
        const statusLabel = project.is_completed ? '발행완료' : readiness.isReady ? '발행가능' : '진행중'
        return { ...project, recordCount, progress, statusLabel }
      }))
      setProjects(withProgress)
      setLoading(false)
    }
    void load()
  }, [user])

  const handleSelect = (project: Project) => {
    setActiveProject(project)
    navigate('/project/workspace')
  }

  const handleCreate = () => {
    if (!canCreate) {
      showPaywall()
      return
    }
    navigate('/project/new')
  }

  const filteredProjects = filter === '전체' ? projects : projects.filter((project) => project.statusLabel === filter)
  const emptyFilterMessage = filter === '전체' ? '' : filter === '진행중' ? '지금 쓰고 있는 책이 없어요.' : filter === '발행가능' ? '아직 발행 준비를 마친 책이 없어요.' : '아직 발행한 책이 없어요.'

  if (loading) return <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">로딩 중...</div>

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-surface">
      <header className="px-5 pb-3 pt-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-sage">MY LIBRARY</p>
        <h1 className="mt-1 font-serif text-2xl font-bold">내 서재</h1>
        <p className="mt-1 text-sm text-ink-muted">나의 시간이 책이 되어 쌓이는 곳</p>
      </header>

      <div className="flex-1 px-5 pb-6 pt-2">
        {projects.length > 0 && <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{(['전체', '진행중', '발행가능', '발행완료'] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={['shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors', filter === item ? 'border-ink bg-ink text-surface' : 'border-border bg-surface-card text-ink-muted'].join(' ')}>{item}</button>)}</div>}
        {projects.length === 0 ? <EmptyState variant="home" /> : (
          <div className="border-t border-border">
            {filteredProjects.length === 0 && <div className="border-b border-border py-10 text-center"><p className="font-serif text-sm font-bold">{emptyFilterMessage}</p><p className="mt-2 text-xs text-ink-muted">다른 상태의 책을 선택하거나 기록을 이어가보세요.</p></div>}
            {filteredProjects.map((project) => {
              const typeLabel = PROJECT_TYPES.find((p) => p.type === project.type)?.label ?? '나의 기록'
              const isActive = activeProject?.id === project.id
              return (
                <button key={project.id} type="button" className={['w-full border-b border-border py-4 text-left transition-colors', isActive ? 'bg-accent-light/30' : 'bg-transparent'].join(' ')} onClick={() => handleSelect(project)}>
                  <div className="flex gap-4">
                    <div className="flex h-24 w-16 shrink-0 flex-col justify-between rounded-r-md rounded-l-sm bg-ink p-2.5 text-surface shadow-paper">
                      <span className="text-[7px] tracking-[0.16em] opacity-60">MY CHAPTER</span>
                      <span className="line-clamp-3 font-serif text-[11px] font-bold leading-snug">{project.title}</span>
                      <span className="h-px w-5 bg-sage" />
                    </div>
                    <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-base font-bold">{project.title}</p>
                      <p className="mt-1 text-xs text-ink-muted">{typeLabel} · {project.statusLabel}</p>
                    </div>
                    <p className="text-lg font-bold text-accent">{project.progress}%</p>
                  </div>
                  <ProgressBar value={project.progress} />
                  <p className="mt-2 text-[11px] text-ink-faint">{project.recordCount}개 기록 · 이야기 준비도 {project.progress}%</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <button type="button" className="mt-6 w-full border-y border-dashed border-border py-4 text-sm font-semibold text-accent" onClick={handleCreate}>
          + 새 책 시작하기
        </button>
      </div>
    </div>
  )
}
