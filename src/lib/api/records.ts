import { isDevBypass } from '@/lib/devBypass'
import { resolveInsertFailure } from '@/lib/recordCreatePolicy'
import {
  mockCreateRecord,
  mockDeleteRecord,
  mockGetNextRecordNumber,
  mockGetPhotoSignedUrl,
  mockGetRecord,
  mockGetRecordCount,
  mockListRecords,
  mockUpdateRecord,
  mockUploadRecordPhoto,
} from '@/mocks'
import { mockCreateBadgeNotifications } from '@/mocks/notifications'
import { supabase } from '@/lib/supabase'
import type { JournalRecord, RecordModeInstance } from '@/types/database'
import { checkBadgeEvents } from '@/utils/badges'
import { calculateStreak } from '@/utils/streak'
import { createBadgeNotifications } from './notifications'

export interface CreateRecordInput {
  projectId: string
  userId: string
  requestId?: string
  mode: RecordModeInstance
  content: string
  questionText?: string
  title?: string
  photoUrl?: string
  emotionTags: string[]
}

export interface UpdateRecordInput {
  content?: string
  title?: string
  photoUrl?: string
  emotionTags?: string[]
  questionText?: string
}

export interface SaveRecordResult {
  record: JournalRecord
  recordCount: number
  streak: number
  badgeTitles: string[]
}

/** Same request UUID already saved a different payload — do not auto-insert another row. */
export class RecordRequestConflictError extends Error {
  readonly code = 'REQUEST_ID_CONTENT_MISMATCH'
  readonly existing: JournalRecord

  constructor(existing: JournalRecord) {
    super('이미 저장된 기록이 있어요. 기존 기록을 열거나 새 기록으로 저장할 수 있어요.')
    this.name = 'RecordRequestConflictError'
    this.existing = existing
  }
}

/** Insert may have succeeded but we cannot confirm — never invent a duplicate. */
export class RecordLookupError extends Error {
  readonly code = 'REQUEST_LOOKUP_FAILED'

  constructor(
    message = '이전 저장 결과를 확인하지 못했어요. 네트워크를 확인한 뒤 다시 시도해주세요.',
  ) {
    super(message)
    this.name = 'RecordLookupError'
  }
}

function analyzeRecordInBackground(recordId: string): void {
  void supabase.functions
    .invoke('analyze-record', { body: { record_id: recordId } })
    .catch(() => {
      // Analysis is derived data. A failure must never block or undo the user's saved record.
    })
}

export async function getNextRecordNumber(projectId: string): Promise<number> {
  if (isDevBypass()) return mockGetNextRecordNumber(projectId)

  const { data } = await supabase
    .from('records')
    .select('record_number')
    .eq('project_id', projectId)
    .order('record_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data?.record_number ?? 0) + 1
}

export async function listRecords(
  userId: string,
  options?: { projectId?: string; limit?: number; offset?: number },
): Promise<JournalRecord[]> {
  if (isDevBypass()) return mockListRecords(userId, options)

  let query = supabase
    .from('records')
    .select('*')
    .eq('user_id', userId)
    .eq('is_draft', false)
    .order('created_at', { ascending: false })

  if (options?.projectId) {
    query = query.eq('project_id', options.projectId)
  }
  if (options?.limit) {
    query = query.range(options.offset ?? 0, (options.offset ?? 0) + options.limit - 1)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getRecord(id: string, userId?: string): Promise<JournalRecord | null> {
  if (isDevBypass()) {
    const record = mockGetRecord(id)
    return record && (!userId || record.user_id === userId) ? record : null
  }

  let query = supabase.from('records').select('*').eq('id', id)
  if (userId) query = query.eq('user_id', userId)
  const { data, error } = await query.maybeSingle()

  if (error) throw error
  return data
}

export async function getRecordCount(projectId: string): Promise<number> {
  if (isDevBypass()) return mockGetRecordCount(projectId)

  const { count, error } = await supabase
    .from('records')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('is_draft', false)

  if (error) throw error
  return count ?? 0
}

export async function createRecord(input: CreateRecordInput): Promise<SaveRecordResult> {
  if (isDevBypass()) {
    const result = mockCreateRecord(input)
    const badges = checkBadgeEvents(result.streak, result.recordCount)
    if (badges.length > 0) {
      await mockCreateBadgeNotifications(input.userId, badges)
    }
    return result
  }

  const recordNumber = await getNextRecordNumber(input.projectId)
  const requestId = input.requestId ?? crypto.randomUUID()

  const { data, error } = await supabase
    .from('records')
    .insert({
      id: requestId,
      project_id: input.projectId,
      user_id: input.userId,
      record_number: recordNumber,
      mode: input.mode,
      content: input.content,
      question_text: input.questionText ?? null,
      title: input.title ?? null,
      photo_url: input.photoUrl ?? null,
      emotion_tags: input.emotionTags,
    })
    .select()
    .single()

  if (error) {
    // A timed-out response may hide a committed insert: look up this exact request ID.
    const { data: existing, error: lookupError } = await supabase
      .from('records')
      .select('*')
      .eq('id', requestId)
      .eq('user_id', input.userId)
      .eq('project_id', input.projectId)
      .maybeSingle()

    const resolution = resolveInsertFailure({
      existing: existing ?? null,
      lookupFailed: Boolean(lookupError),
      input: {
        userId: input.userId,
        projectId: input.projectId,
        mode: input.mode,
        content: input.content,
        questionText: input.questionText,
        title: input.title,
        photoUrl: input.photoUrl,
        emotionTags: input.emotionTags,
      },
    })

    if (resolution.kind === 'reuse') {
      analyzeRecordInBackground(resolution.existing.id)
      return finalizeSave(input.userId, input.projectId, resolution.existing)
    }
    if (resolution.kind === 'conflict') {
      throw new RecordRequestConflictError(resolution.existing)
    }
    if (resolution.kind === 'lookup_failed') {
      throw new RecordLookupError()
    }

    throw error
  }

  analyzeRecordInBackground(data.id)
  return finalizeSave(input.userId, input.projectId, data)
}

export async function updateRecord(
  id: string,
  userId: string,
  projectId: string,
  input: UpdateRecordInput,
): Promise<SaveRecordResult> {
  if (isDevBypass()) {
    return mockUpdateRecord(id, userId, projectId, input)
  }

  const { data, error } = await supabase
    .from('records')
    .update({
      content: input.content,
      title: input.title,
      photo_url: input.photoUrl,
      emotion_tags: input.emotionTags,
      question_text: input.questionText,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .select()
    .single()

  if (error) throw error

  analyzeRecordInBackground(data.id)
  return finalizeSave(userId, projectId, data)
}

export async function deleteRecord(id: string, userId: string): Promise<void> {
  if (isDevBypass()) {
    mockDeleteRecord(id, userId)
    return
  }

  const { data: record, error: readError } = await supabase
    .from('records')
    .select('photo_url')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (readError) throw readError

  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error

  if (record?.photo_url) {
    await supabase.storage.from('record-photos').remove([record.photo_url])
  }
}

async function finalizeSave(
  userId: string,
  projectId: string,
  record: JournalRecord,
): Promise<SaveRecordResult> {
  const allRecords = await listRecords(userId, { projectId })
  const recordCount = allRecords.length
  const streak = calculateStreak(allRecords)

  const badges = checkBadgeEvents(streak, recordCount)
  if (badges.length > 0) {
    try {
      await createBadgeNotifications(userId, badges)
    } catch {
      // Badge notifications must not turn a successful record insert into a save error.
    }
  }

  return {
    record,
    recordCount,
    streak,
    badgeTitles: badges.map((b) => b.title),
  }
}

export async function uploadRecordPhoto(
  userId: string,
  projectId: string,
  file: File,
): Promise<string> {
  if (isDevBypass()) return mockUploadRecordPhoto(userId, projectId, file)

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${projectId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('record-photos')
    .upload(path, file, { upsert: false })

  if (error) throw error
  return path
}

export async function getPhotoSignedUrl(path: string): Promise<string | null> {
  if (isDevBypass()) return mockGetPhotoSignedUrl(path)

  const { data, error } = await supabase.storage
    .from('record-photos')
    .createSignedUrl(path, 3600)

  if (error) return null
  return data.signedUrl
}

/**
 * Best-effort cleanup for temp uploads. Never deletes paths outside the caller's folder,
 * and skips paths still referenced by another record owned by this user.
 */
export async function removeUnreferencedPhoto(
  userId: string,
  projectId: string,
  path: string | null | undefined,
): Promise<void> {
  if (!path || isDevBypass()) return

  const expectedPrefix = `${userId}/${projectId}/`
  if (!path.startsWith(expectedPrefix)) {
    console.error('Blocked photo cleanup outside owner folder:', path)
    return
  }

  try {
    const { count, error } = await supabase
      .from('records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('photo_url', path)

    if (error) {
      console.error('Photo reference check failed:', error)
      return
    }
    if ((count ?? 0) > 0) return

    const { error: removeError } = await supabase.storage.from('record-photos').remove([path])
    if (removeError) console.error('Orphan photo remove failed:', removeError)
  } catch (err) {
    console.error('Orphan photo cleanup error:', err)
  }
}
