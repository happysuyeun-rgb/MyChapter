import { create } from 'zustand'
import type { JournalRecord, Project } from '@/types/database'
import type { SaveRecordResult } from '@/lib/api/records'

interface RecordState {
  lastSave: SaveRecordResult | null
  lastProject: Project | null
  setLastSave: (result: SaveRecordResult, project: Project) => void
  clearLastSave: () => void
  editingRecord: JournalRecord | null
  setEditingRecord: (record: JournalRecord | null) => void
}

export const useRecordStore = create<RecordState>((set) => ({
  lastSave: null,
  lastProject: null,
  editingRecord: null,

  setLastSave: (result, project) =>
    set({ lastSave: result, lastProject: project }),

  clearLastSave: () => set({ lastSave: null, lastProject: null }),

  setEditingRecord: (record) => set({ editingRecord: record }),
}))
