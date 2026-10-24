import type { JournalRecord, RecordModeInstance } from '@/types/database'

/** Payload used for idempotent create / conflict detection (no DB I/O). */
export interface CreatePayloadCompare {
  userId: string
  projectId: string
  mode: RecordModeInstance
  content: string
  questionText?: string | null
  title?: string | null
  photoUrl?: string | null
  emotionTags: string[]
}

export function tagsEqual(a: string[] | null | undefined, b: string[]): boolean {
  const left = [...(a ?? [])].map(String).sort()
  const right = [...b].map(String).sort()
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

export function ownsRecord(
  existing: JournalRecord,
  userId: string,
  projectId: string,
): boolean {
  return existing.user_id === userId && existing.project_id === projectId
}

/**
 * Exact create-payload identity for ambiguous-response recovery.
 * question_text is part of identity so regenerated AI questions are not silently merged.
 */
export function isSameCreatePayload(
  existing: JournalRecord,
  input: CreatePayloadCompare,
): boolean {
  if (!ownsRecord(existing, input.userId, input.projectId)) return false

  return (
    existing.mode === input.mode &&
    existing.content === input.content &&
    (existing.question_text ?? null) === (input.questionText ?? null) &&
    (existing.title ?? null) === (input.title ?? null) &&
    (existing.photo_url ?? null) === (input.photoUrl ?? null) &&
    tagsEqual(existing.emotion_tags, input.emotionTags)
  )
}

export type InsertFailureResolution =
  | { kind: 'reuse'; existing: JournalRecord }
  | { kind: 'conflict'; existing: JournalRecord }
  | { kind: 'lookup_failed' }
  | { kind: 'unknown' }

/**
 * After a failed insert, decide reuse vs conflict vs safe abort.
 * Never invents a new insert — caller must not auto-create on conflict/lookup_failed.
 */
export function resolveInsertFailure(args: {
  existing: JournalRecord | null
  lookupFailed: boolean
  input: CreatePayloadCompare
}): InsertFailureResolution {
  if (args.lookupFailed) return { kind: 'lookup_failed' }

  const { existing, input } = args
  if (!existing) return { kind: 'unknown' }

  if (!ownsRecord(existing, input.userId, input.projectId)) {
    return { kind: 'lookup_failed' }
  }

  if (isSameCreatePayload(existing, input)) {
    return { kind: 'reuse', existing }
  }

  return { kind: 'conflict', existing }
}
