import { devBypassMocks } from '@/lib/devBypassMocks'
import { isDevBypass } from '@/lib/devBypass'
import { supabase } from '@/lib/supabase'
import type { JournalRecord, RecordModeInstance } from '@/types/database'
import { checkBadgeEvents } from '@/utils/badges'
import { calculateStreak } from '@/utils/streak'
import { createBadgeNotifications } from './notifications'

export interface CreateRecordInput {
  projectId: string
  userId: string
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
  progress: number
  streak: number
  badgeTitles: string[]
}

export async function getNextRecordNumber(projectId: string): Promise<number> {
  if (isDevBypass()) return devBypassMocks.getNextRecordNumber(projectId)

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
  if (isDevBypass()) return devBypassMocks.listRecords(userId, options)

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

export async function getRecord(id: string): Promise<JournalRecord | null> {
  if (isDevBypass()) return devBypassMocks.getRecord(id)

  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getRecordCount(projectId: string): Promise<number> {
  if (isDevBypass()) return devBypassMocks.getRecordCount(projectId)

  const { count, error } = await supabase
    .from('records')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('is_draft', false)

  if (error) throw error
  return count ?? 0
}

export async function createRecord(
  input: CreateRecordInput,
  targetCount: number,
): Promise<SaveRecordResult> {
  if (isDevBypass()) return devBypassMocks.createRecord(input, targetCount)

  const recordNumber = await getNextRecordNumber(input.projectId)

  const { data, error } = await supabase
    .from('records')
    .insert({
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

  if (error) throw error

  return finalizeSave(input.userId, input.projectId, data, targetCount)
}

export async function updateRecord(
  id: string,
  userId: string,
  projectId: string,
  input: UpdateRecordInput,
  targetCount: number,
): Promise<SaveRecordResult> {
  if (isDevBypass()) {
    return devBypassMocks.updateRecord(id, userId, projectId, input, targetCount)
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
    .select()
    .single()

  if (error) throw error
  return finalizeSave(userId, projectId, data, targetCount)
}

export async function deleteRecord(id: string, userId: string): Promise<void> {
  if (isDevBypass()) {
    devBypassMocks.deleteRecord(id, userId)
    return
  }

  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

async function finalizeSave(
  userId: string,
  projectId: string,
  record: JournalRecord,
  targetCount: number,
): Promise<SaveRecordResult> {
  const allRecords = await listRecords(userId, { projectId })
  const recordCount = allRecords.length
  const streak = calculateStreak(allRecords)
  const progress = Math.min(100, Math.round((recordCount / targetCount) * 100))

  const badges = checkBadgeEvents(streak, recordCount)
  if (badges.length > 0) {
    await createBadgeNotifications(userId, badges)
  }

  if (recordCount % 10 === 0) {
    void supabase.functions.invoke('generate-chapter', {
      body: { project_id: projectId },
    })
  }

  return {
    record,
    recordCount,
    progress,
    streak,
    badgeTitles: badges.map((b) => b.title),
  }
}

export async function uploadRecordPhoto(
  userId: string,
  projectId: string,
  file: File,
): Promise<string> {
  if (isDevBypass()) return devBypassMocks.uploadRecordPhoto(userId, projectId, file)

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${projectId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('record-photos')
    .upload(path, file, { upsert: false })

  if (error) throw error
  return path
}

export async function getPhotoSignedUrl(path: string): Promise<string | null> {
  if (isDevBypass()) return devBypassMocks.getPhotoSignedUrl(path)

  const { data, error } = await supabase.storage
    .from('record-photos')
    .createSignedUrl(path, 3600)

  if (error) return null
  return data.signedUrl
}
