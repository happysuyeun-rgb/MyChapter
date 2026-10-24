import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createRecord,
  RecordLookupError,
  RecordRequestConflictError,
  type CreateRecordInput,
  type SaveRecordResult,
} from '@/lib/api/records'
import {
  clearRecordRequestId,
  getOrCreateRecordRequestId,
  mintNewRecordRequestId,
} from '@/lib/recordRequestId'
import type { JournalRecord, RecordModeInstance } from '@/types/database'

interface CreateSaveOptions {
  userId: string
  projectId: string
  mode: RecordModeInstance
  buildInput: (requestId: string) => CreateRecordInput
  onSuccess: (result: SaveRecordResult) => void | Promise<void>
  onClearSideEffects?: () => void
}

/**
 * Create-save with explicit conflict recovery (never auto-inserts a second row).
 */
export function useRecordCreateSave() {
  const navigate = useNavigate()
  const optsRef = useRef<CreateSaveOptions | null>(null)
  const [conflictRecord, setConflictRecord] = useState<JournalRecord | null>(null)
  const [error, setError] = useState('')

  const clearConflict = useCallback(() => {
    setConflictRecord(null)
  }, [])

  const saveCreate = useCallback(async (opts: CreateSaveOptions): Promise<boolean> => {
    optsRef.current = opts
    setError('')
    const requestId = getOrCreateRecordRequestId(opts.userId, opts.projectId, opts.mode)
    try {
      const result = await createRecord(opts.buildInput(requestId))
      clearRecordRequestId(opts.userId, opts.projectId, opts.mode)
      opts.onClearSideEffects?.()
      await opts.onSuccess(result)
      return true
    } catch (err) {
      if (err instanceof RecordRequestConflictError) {
        setConflictRecord(err.existing)
        return false
      }
      if (err instanceof RecordLookupError) {
        setError(err.message)
        return false
      }
      setError('저장에 실패했어요. 다시 시도해주세요.')
      return false
    }
  }, [])

  const openExisting = useCallback(() => {
    if (!conflictRecord) return
    const id = conflictRecord.id
    clearConflict()
    navigate(`/records/${id}`)
  }, [clearConflict, conflictRecord, navigate])

  const saveAsNew = useCallback(async (): Promise<boolean> => {
    const opts = optsRef.current
    if (!opts) return false
    setError('')
    const requestId = mintNewRecordRequestId(opts.userId, opts.projectId, opts.mode)
    try {
      const result = await createRecord(opts.buildInput(requestId))
      clearConflict()
      clearRecordRequestId(opts.userId, opts.projectId, opts.mode)
      opts.onClearSideEffects?.()
      await opts.onSuccess(result)
      return true
    } catch (err) {
      if (err instanceof RecordLookupError) {
        setError(err.message)
        return false
      }
      if (err instanceof RecordRequestConflictError) {
        setConflictRecord(err.existing)
        return false
      }
      setError('저장에 실패했어요. 다시 시도해주세요.')
      return false
    }
  }, [clearConflict])

  return {
    conflictOpen: Boolean(conflictRecord),
    error,
    setError,
    saveCreate,
    openExisting,
    saveAsNew,
    clearConflict,
  }
}
