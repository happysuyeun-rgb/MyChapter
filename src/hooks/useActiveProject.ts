import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '@/lib/api/projects'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@/types/database'

export function useActiveProject() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { activeProject, setActiveProject } = useProjectStore()
  const [loading, setLoading] = useState(!activeProject)

  useEffect(() => {
    if (!user) return
    if (activeProject) {
      setLoading(false)
      return
    }

    const load = async () => {
      const projects = await getProjects(user.id)
      if (projects.length === 0) {
        navigate('/home', { replace: true })
        return
      }
      setActiveProject(projects[0])
      setLoading(false)
    }

    void load()
  }, [user, activeProject, setActiveProject, navigate])

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
