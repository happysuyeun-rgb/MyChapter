import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!user) return

    const load = async () => {
      setLoading(true)
      const projects = await getProjects(user.id)

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
    }

    void load()
  }, [user, activeProjectId, activeProject?.id, activeProject?.updated_at, setActiveProject, navigate])

  return { project: activeProject, loading }
}

export function useProjectList() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void getProjects(user.id).then((data) => {
      setProjects(data)
      setLoading(false)
    })
  }, [user])

  return { projects, loading }
}
