import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '@/lib/api/projects'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@/types/database'

export function useActiveProject() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { activeProject, activeProjectId, setActiveProject } = useProjectStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const projects = await getProjects(user.id)
        if (cancelled) return

        if (projects.length === 0) {
          setActiveProject(null)
          setLoading(false)
          navigate('/home', { replace: true })
          return
        }

        const selected = projects.find((project) => project.id === activeProjectId) ?? projects[0]

        if (!activeProject || activeProject.id !== selected.id || activeProject.updated_at !== selected.updated_at) {
          setActiveProject(selected)
        }

        setLoading(false)
      } catch {
        if (cancelled) return
        setError(true)
        setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [user, activeProjectId, activeProject?.id, activeProject?.updated_at, setActiveProject, navigate, retryKey])

  const retry = useCallback(() => setRetryKey((key) => key + 1), [])

  return { project: activeProject, loading, error, retry }
}

export function useProjectList() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(false)
    getProjects(user.id)
      .then((data) => {
        if (cancelled) return
        setProjects(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [user, retryKey])

  const retry = useCallback(() => setRetryKey((key) => key + 1), [])

  return { projects, loading, error, retry }
}
