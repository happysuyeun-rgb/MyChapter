import { isDevBypass } from '@/lib/devBypass'
import { supabase } from '@/lib/supabase'
import type { Json, RecordModeInstance } from '@/types/database'

export interface DraftPayload {
  questionText?: string
  content?: string
  title?: string
  emotionTags?: string[]
  photoUrl?: string
}

export async function saveDraft(
  userId: string,
  projectId: string,
  mode: RecordModeInstance,
  payload: DraftPayload,
): Promise<void> {
  if (isDevBypass()) return

  const { error } = await supabase.from('record_drafts').upsert(
    {
      user_id: userId,
      project_id: projectId,
      mode,
      payload: payload as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,project_id,mode' },
  )

  if (error) throw error
}

export async function loadDraft(
  userId: string,
  projectId: string,
  mode: RecordModeInstance,
): Promise<DraftPayload | null> {
  if (isDevBypass()) return null

  const { data, error } = await supabase
    .from('record_drafts')
    .select('payload')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('mode', mode)
    .maybeSingle()

  if (error) throw error
  return (data?.payload as DraftPayload) ?? null
}

export async function deleteDraft(
  userId: string,
  projectId: string,
  mode: RecordModeInstance,
): Promise<void> {
  if (isDevBypass()) return

  await supabase
    .from('record_drafts')
    .delete()
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('mode', mode)
}
