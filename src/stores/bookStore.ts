import { create } from 'zustand'
import type { Project } from '@/types/database'

interface BookState {
  publishResult: {
    project: Project
    recordCount: number
    pageCount: number
    coverTemplateId: string
  } | null
  selectedCoverId: string
  setSelectedCoverId: (id: string) => void
  setPublishResult: (result: BookState['publishResult']) => void
  clearPublishResult: () => void
}

export const useBookStore = create<BookState>((set) => ({
  publishResult: null,
  selectedCoverId: 'cover_01',

  setSelectedCoverId: (id) => set({ selectedCoverId: id }),

  setPublishResult: (result) => set({ publishResult: result }),

  clearPublishResult: () => set({ publishResult: null }),
}))
