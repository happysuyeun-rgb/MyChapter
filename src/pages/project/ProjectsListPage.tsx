import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/common'
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
  statusLabel: '진행중' | '발행가능' | '발행완료'
}

const FILTERS = ['전체', '진행중', '발행가능', '발행완료'] as const
type Filter = typeof FILTERS[number]

export function ProjectsListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { activeProject, setActiveProject } = useProjectStore()
  const { canCreate } = useProjectLimit()
  const { showPaywall } = usePaywallStore()
  const [projects, setProjects] = useState<ProjectWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('전체')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const projectData = await getProjects(user.id)
      const withProgress = await Promise.all(projectData.map(async (project) => {
        const records = await listRecords(user.id, { projectId: project.id })
        const recordCount = records.length
        const readiness = getBookReadiness(project, recordCount)
        const statusLabel: ProjectWithProgress['statusLabel'] =
          project.is_completed ? '발행완료' : readiness.isReady ? '발행가능' : '진행중'
        return { ...project, recordCount, progress: readiness.score, statusLabel }
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
  const emptyFilterMessage =
    filter === '진행중'
      ? '지금 쓰고 있는 책이 없어요.'
      : filter === '발행가능'
        ? '아직 발행 준비를 마친 책이 없어요.'
        : filter === '발행완료'
          ? '아직 발행한 책이 없어요.'
          : '아직 책이 없어요.'

  if (loading) return <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">로딩 중...</div>

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-surface">
      <header className="px-5 pb-6 pt-7">
        <div className="flex items-end justify-between border-b border-ink pb-5">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-sage">MY LIBRARY</p>
            <h1 className="mt-2 font-serif text-[30px] font-bold tracking-[-0.03em]">내 서재</h1>
            <p className="mt-2 text-xs text-ink-muted">{projects.length}권의 책 · 기록과 발행을 한곳에서</p>
          </div>
          <button type="button" className="min-h-11 text-sm font-semibold" onClick={handleCreate}>
            새 책 +
          </button>
        </div>
      </header>

      {projects.length === 0 ? (
        <EmptyState variant="home" />
      ) : (
        <main className="px-5 pb-10">
          <div className="flex border-b border-border">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={[
                  'min-h-11 flex-1 border-b-2 px-1 text-[11px] font-semibold',
                  filter === item ? 'border-ink text-ink' : 'border-transparent text-ink-faint',
                ].join(' ')}
              >
                {item}
              </button>
            ))}
          </div>

          {filteredProjects.length === 0 ? (
            <div className="border-b border-border py-14 text-center">
              <p className="font-serif text-base font-bold">{emptyFilterMessage}</p>
              <p className="mt-2 text-xs text-ink-muted">다른 상태의 책을 확인하거나 기록을 이어가보세요.</p>
            </div>
          ) : (
            <div>
              {filteredProjects.map((project, index) => {
                const typeLabel = PROJECT_TYPES.find((p) => p.type === project.type)?.label ?? '나의 기록'
                const isActive = activeProject?.id === project.id
                return (
                  <button
                    key={project.id}
                    type="button"
                    className="group w-full border-b border-border py-6 text-left active:bg-accent-light/30"
                    onClick={() => handleSelect(project)}
                  >
                    <div className="flex gap-5">
                      <div className="relative shrink-0">
                        <div className={[
                          'flex h-[126px] w-[84px] flex-col justify-between rounded-r-md rounded-l-[3px] p-3 text-surface shadow-[7px_8px_0_rgba(59,53,45,.10)]',
                          project.statusLabel === '발행완료' ? 'bg-sage' : 'bg-ink',
                        ].join(' ')}>
                          <span className="text-[6px] tracking-[0.18em] opacity-55">MY CHAPTER</span>
                          <div>
                            <span className="mb-3 block h-px w-6 bg-surface/45" />
                            <span className="line-clamp-4 font-serif text-[11px] font-bold leading-[1.45]">{project.title}</span>
                          </div>
                          <span className="text-[6px] opacity-55">{typeLabel}</span>
                        </div>
                        {isActive && (
                          <span className="absolute -right-2 top-2 bg-terracotta px-1.5 py-1 text-[8px] font-bold tracking-[0.08em] text-white">
                            NOW
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold tracking-[0.12em] text-sage">
                              BOOK {String(index + 1).padStart(2, '0')} · {project.statusLabel}
                            </p>
                            <h2 className="mt-2 line-clamp-2 font-serif text-[18px] font-bold leading-snug tracking-[-0.02em]">
                              {project.title}
                            </h2>
                          </div>
                          <span className="text-lg text-ink-faint transition-transform group-active:translate-x-1">→</span>
                        </div>

                        <p className="mt-2 text-xs text-ink-muted">{typeLabel}</p>

                        <div className="mt-6">
                          <div className="flex items-end justify-between">
                            <span className="text-[10px] text-ink-faint">STORY READINESS</span>
                            <span className="font-serif text-2xl font-bold">{project.progress}%</span>
                          </div>
                          <div className="mt-2 h-px bg-border">
                            <div className="h-px bg-ink" style={{ width: `${project.progress}%` }} />
                          </div>
                          <p className="mt-2 text-[10px] text-ink-faint">{project.recordCount} pages collected</p>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <button
            type="button"
            className="mt-7 flex min-h-[54px] w-full items-center justify-between border-y border-dashed border-border px-1 text-left"
            onClick={handleCreate}
          >
            <span>
              <span className="block font-serif text-sm font-bold">새로운 한 권 시작하기</span>
              <span className="mt-1 block text-[11px] text-ink-muted">또 다른 이야기를 위한 빈 책</span>
            </span>
            <span className="text-xl text-ink-faint">+</span>
          </button>
        </main>
      )}
    </div>
  )
}
