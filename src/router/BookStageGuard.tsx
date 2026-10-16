import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getProjects } from '@/lib/api/projects'
import { getRecordCount } from '@/lib/api/records'
import { listChapters } from '@/lib/api/chapters'
import { getBookReadiness } from '@/utils/bookReadiness'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'

type StageDecision = { allowed: true } | { allowed: false; redirect: string }

/** Route-entry protection for the active Book. RLS remains authoritative for data access. */
export function BookStageGuard() {
  const { user } = useAuthStore()
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const location = useLocation()
  const [decision, setDecision] = useState<StageDecision | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    setDecision(null)
    setError(false)
    if (!user) return
    const run = async () => {
      try {
        const projects = await getProjects(user.id)
        const project = projects.find((p) => p.id === activeProjectId) ?? projects[0]
        if (!project) {
          if (!cancelled) setDecision({ allowed: false, redirect: '/library' })
          return
        }
        const path = location.pathname
        // Chapter editing/preview must check ownership separately in its page API.
        if (path.startsWith('/book/chapter/')) {
          if (!cancelled) setDecision({ allowed: true })
          return
        }
        const recordCount = await getRecordCount(project.id)
        if (!getBookReadiness(project, recordCount).isReady) {
          if (!cancelled) setDecision({ allowed: false, redirect: '/project/workspace' })
          return
        }
        if (path === '/book' || path === '/book/manuscript') {
          if (!cancelled) setDecision({ allowed: true })
          return
        }
        const chapters = await listChapters(project.id)
        if (!chapters.length) {
          if (!cancelled) setDecision({ allowed: false, redirect: '/book' })
          return
        }
        if (!project.manuscript_reviewed_at && (path === '/book/cover' || path === '/book/review')) {
          if (!cancelled) setDecision({ allowed: false, redirect: '/book/manuscript' })
          return
        }
        if (path === '/book/review' && !(project.selected_cover_id ?? project.cover_template_id)) {
          if (!cancelled) setDecision({ allowed: false, redirect: '/book/cover' })
          return
        }
        if (!cancelled) setDecision({ allowed: true })
      } catch {
        if (!cancelled) setError(true)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [user, activeProjectId, location.pathname, retry])

  if (error) return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-sm text-ink-muted">
      <p>책 접근 권한을 확인하지 못했어요.</p>
      <button type="button" onClick={() => setRetry((n) => n + 1)} className="border-b border-ink py-2 text-ink">다시 시도</button>
    </div>
  )
  if (!decision) return <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">접근 권한 확인 중...</div>
  return decision.allowed ? <Outlet /> : <Navigate to={decision.redirect} replace />
}
