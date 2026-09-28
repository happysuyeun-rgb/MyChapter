import { create } from 'zustand'
import type { Project } from '@/types/database'

export type PublishStage = 'idle' | 'cover' | 'toc' | 'body' | 'pdf' | 'done' | 'error'

interface BookState {
  publishResult: {
    project: Project
    recordCount: number
    pageCount: number
    coverTemplateId: string
    publicationId: string
    version: number
  } | null
  selectedCoverId: string
  publishStage: PublishStage
  publishError: string | null
  setSelectedCoverId: (id: string) => void
  setPublishResult: (result: BookState['publishResult']) => void
  clearPublishResult: () => void
  setPublishStage: (stage: PublishStage, error?: string | null) => void
  resetPublishState: () => void
}

export const useBookStore = create<BookState>((set) => ({
  publishResult: null,
  selectedCoverId: 'cover_01',
  publishStage: 'idle',
  publishError: null,

  setSelectedCoverId: (id) => set({ selectedCoverId: id }),
  setPublishResult: (result) => set({ publishResult: result }),
  clearPublishResult: () => set({ publishResult: null }),
  setPublishStage: (stage, error = null) => set({ publishStage: stage, publishError: error }),
  resetPublishState: () => set({ publishStage: 'idle', publishError: null }),
}))
