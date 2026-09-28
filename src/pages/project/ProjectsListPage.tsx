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

interface ProjectWithProgress extends Project {
  recordCount: number
  progress: number
}

export function ProjectsListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { activeProject, setActiveProject } = useProjectStore()
  const { canCreate } = useProjectLimit()
  const { showPaywall } = usePaywallStore()
  const [projects, setProjects] = useState<ProjectWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const projectData = await getProjects(user.id)
      const withProgress = await Promise.all(projectData.map(async (project) => {
        const records = await listRecords(user.id, { projectId: project.id })
        const recordCount = records.length
        const progress = Math.min(100, Math.round((recordCount / project.target_count) * 100))
        return { ...project, recordCount, progress }
      }))
      setProjects(withProgress)
      setLoading(false)
    }
    void load()
  }, [user])

  const handleSelect = (project: Project) => {
    setActiveProject(project)
    navigate('/home')
  }

  const handleCreate = () => {
    if (!canCreate) {
      showPaywall()
      return
    }
    navigate('/project/new')
  }

  if (loading) return <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">로딩 중...</div>

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-surface">
      <header className="px-5 pb-3 pt-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-sage">MY LIBRARY</p>
        <h1 className="mt-1 font-serif text-2xl font-bold">내 서재</h1>
        <p className="mt-1 text-sm text-ink-muted">나의 시간이 책이 되어 쌓이는 곳</p>
      </header>

      <div className="flex-1 px-5 pb-6 pt-2">
        {projects.length === 0 ? <EmptyState variant="home" /> : (
          <div className="space-y-3">
            {projects.map((project) => {
              const typeLabel = PROJECT_TYPES.find((p) => p.type === project.type)?.label ?? '나의 기록'
              const isActive = activeProject?.id === project.id
              return (
                <button key={project.id} type="button" className={['w-full rounded-card border p-4 text-left shadow-paper transition-colors', isActive ? 'border-accent bg-accent-light/50' : 'border-border bg-surface-card'].join(' ')} onClick={() => handleSelect(project)}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-base font-bold">{project.title}</p>
                      <p className="mt-1 text-xs text-ink-muted">{typeLabel}{project.is_completed ? ' · 완성' : ' · 집필 중'}</p>
                    </div>
                    <p className="text-lg font-bold text-accent">{project.progress}%</p>
                  </div>
                  <ProgressBar value={project.progress} />
                  <p className="mt-2 text-[11px] text-ink-faint">{project.recordCount}/{project.target_count}개 기록</p>
                </button>
              )
            })}
          </div>
        )}

        <button type="button" className="mt-6 w-full rounded-card border border-dashed border-border bg-surface-card py-4 text-sm font-semibold text-accent" onClick={handleCreate}>
          + 새 책 시작하기
        </button>
      </div>
    </div>
  )
}
