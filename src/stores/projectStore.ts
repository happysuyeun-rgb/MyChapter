import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, ProjectType, RecordFrequency, RecordMode } from '@/types/database'
import type { PeriodDays } from '@/utils/calculateRoutine'

export interface NewProjectDraft {
  type: ProjectType | null
  title: string
  periodDays: PeriodDays
  frequency: RecordFrequency
  notificationTime: string
  recordMode: RecordMode
}

interface ProjectState {
  projects: Project[]
  activeProject: Project | null
  createdProject: Project | null
  firstQuestion: string | null
  draft: NewProjectDraft
  setDraft: (patch: Partial<NewProjectDraft>) => void
  resetDraft: () => void
  setProjects: (projects: Project[]) => void
  setActiveProject: (project: Project | null) => void
  setCreatedProject: (project: Project | null) => void
  setFirstQuestion: (question: string | null) => void
}

const defaultDraft: NewProjectDraft = {
  type: null,
  title: '',
  periodDays: 100,
  frequency: 'week5',
  notificationTime: '21:00',
  recordMode: 'question',
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      activeProject: null,
      createdProject: null,
      firstQuestion: null,
      draft: { ...defaultDraft },

      setDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
      resetDraft: () => set({ draft: { ...defaultDraft } }),
      setProjects: (projects) => set({ projects }),
      setActiveProject: (project) => set({ activeProject: project }),
      setCreatedProject: (project) => set({ createdProject: project }),
      setFirstQuestion: (question) => set({ firstQuestion: question }),
    }),
    {
      name: 'mychapter-project-store',
      partialize: (state) => ({ activeProject: state.activeProject }),
    },
  ),
)
