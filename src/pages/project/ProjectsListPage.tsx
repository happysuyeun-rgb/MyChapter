import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, ProgressBar } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { getProjects } from '@/lib/api/projects'
import { listRecords } from '@/lib/api/records'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuthStore } from '@/stores/authStore'
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
  const { isPro, loading: subLoading } = useSubscription()
  const [projects, setProjects] = useState<ProjectWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || subLoading) return

    if (!isPro) {
      navigate('/home', { replace: true })
      return
    }

    const load = async () => {
      const projectData = await getProjects(user.id)

      const withProgress = await Promise.all(
        projectData.map(async (project) => {
          const records = await listRecords(user.id, { projectId: project.id })
          const recordCount = records.length
          const progress = Math.min(
            100,
            Math.round((recordCount / project.target_count) * 100),
          )
          return { ...project, recordCount, progress }
        }),
      )

      setProjects(withProgress)
      setLoading(false)
    }

    void load()
  }, [user, isPro, subLoading, navigate])

  const handleSelect = (project: Project) => {
    setActiveProject(project)
    navigate('/home')
  }

  if (subLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar title="프로젝트 목록" leftLabel="‹ 뒤로" />

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {projects.length === 0 ? (
          <EmptyState variant="home" />
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const typeLabel =
                PROJECT_TYPES.find((p) => p.type === project.type)?.label ?? '진행 중'
              const isActive = activeProject?.id === project.id

              return (
                <button
                  key={project.id}
                  type="button"
                  className={[
                    'w-full rounded-card border p-4 text-left transition-colors',
                    isActive ? 'border-accent bg-accent-light/30' : 'border-border bg-white',
                  ].join(' ')}
                  onClick={() => handleSelect(project)}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{project.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{typeLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-accent">{project.progress}%</p>
                      {isActive && (
                        <p className="text-[10px] font-semibold text-accent">선택됨</p>
                      )}
                    </div>
                  </div>
                  <ProgressBar value={project.progress} />
                  <p className="mt-2 text-[11px] text-ink-faint">
                    {project.recordCount}/{project.target_count}개 기록
                    {project.is_completed && ' · 완료'}
                  </p>
                </button>
              )
            })}
          </div>
        )}

        <button
          type="button"
          className="mt-6 w-full rounded-card border border-dashed border-border py-4 text-sm font-medium text-accent"
          onClick={() => navigate('/project/new')}
        >
          + 새 프로젝트
        </button>
      </div>
    </div>
  )
}
