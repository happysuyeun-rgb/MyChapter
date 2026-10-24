import { describe, expect, it } from 'vitest'
import {
  isSameCreatePayload,
  resolveInsertFailure,
  tagsEqual,
} from '@/lib/recordCreatePolicy'
import type { JournalRecord } from '@/types/database'

function record(partial: Partial<JournalRecord> & Pick<JournalRecord, 'id' | 'content' | 'mode'>): JournalRecord {
  return {
    project_id: 'proj-1',
    user_id: 'user-1',
    record_number: 1,
    chapter_id: null,
    question_text: null,
    title: null,
    photo_url: null,
    emotion_tags: [],
    is_draft: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

const baseInput = {
  userId: 'user-1',
  projectId: 'proj-1',
  mode: 'free' as const,
  content: 'hello world enough',
  title: 't',
  emotionTags: ['joy'],
}

describe('tagsEqual', () => {
  it('ignores order', () => {
    expect(tagsEqual(['a', 'b'], ['b', 'a'])).toBe(true)
  })
})

describe('isSameCreatePayload', () => {
  it('requires matching question_text for question mode', () => {
    const existing = record({
      id: 'req-1',
      mode: 'question',
      content: 'same body text!!',
      question_text: 'Q1',
      emotion_tags: ['joy'],
    })
    const qInput = {
      userId: 'user-1',
      projectId: 'proj-1',
      mode: 'question' as const,
      content: 'same body text!!',
      questionText: 'Q1',
      title: null as string | null,
      photoUrl: null as string | null,
      emotionTags: ['joy'],
    }
    expect(isSameCreatePayload(existing, qInput)).toBe(true)
    expect(isSameCreatePayload(existing, { ...qInput, questionText: 'Q2 regenerated' })).toBe(false)
  })

  it('rejects other user or project', () => {
    const existing = record({ id: 'req-1', mode: 'free', content: 'hello world enough', title: 't', emotion_tags: ['joy'] })
    expect(isSameCreatePayload(existing, { ...baseInput, userId: 'other' })).toBe(false)
    expect(isSameCreatePayload(existing, { ...baseInput, projectId: 'other' })).toBe(false)
  })
})

describe('resolveInsertFailure', () => {
  it('reuses identical payload (duplicate request / lost response)', () => {
    const existing = record({
      id: 'req-1',
      mode: 'free',
      content: 'hello world enough',
      title: 't',
      emotion_tags: ['joy'],
    })
    const resolution = resolveInsertFailure({
      existing,
      lookupFailed: false,
      input: baseInput,
    })
    expect(resolution).toEqual({ kind: 'reuse', existing })
  })

  it('conflicts when body changed under same request id (no auto duplicate)', () => {
    const existing = record({
      id: 'req-1',
      mode: 'free',
      content: 'original body text',
      title: 't',
      emotion_tags: ['joy'],
    })
    const resolution = resolveInsertFailure({
      existing,
      lookupFailed: false,
      input: { ...baseInput, content: 'edited body text!!' },
    })
    expect(resolution.kind).toBe('conflict')
    if (resolution.kind === 'conflict') expect(resolution.existing.id).toBe('req-1')
  })

  it('lookup_failed when network cannot confirm prior save', () => {
    expect(
      resolveInsertFailure({
        existing: null,
        lookupFailed: true,
        input: baseInput,
      }),
    ).toEqual({ kind: 'lookup_failed' })
  })

  it('unknown when insert failed and no row exists', () => {
    expect(
      resolveInsertFailure({
        existing: null,
        lookupFailed: false,
        input: baseInput,
      }),
    ).toEqual({ kind: 'unknown' })
  })

  it('photo payload identity includes photo_url', () => {
    const existing = record({
      id: 'req-p',
      mode: 'photo',
      content: 'caption!',
      photo_url: 'user-1/proj-1/a.jpg',
      emotion_tags: [],
    })
    expect(
      resolveInsertFailure({
        existing,
        lookupFailed: false,
        input: {
          userId: 'user-1',
          projectId: 'proj-1',
          mode: 'photo',
          content: 'caption!',
          photoUrl: 'user-1/proj-1/a.jpg',
          emotionTags: [],
        },
      }).kind,
    ).toBe('reuse')
    expect(
      resolveInsertFailure({
        existing,
        lookupFailed: false,
        input: {
          userId: 'user-1',
          projectId: 'proj-1',
          mode: 'photo',
          content: 'caption!',
          photoUrl: 'user-1/proj-1/b.jpg',
          emotionTags: [],
        },
      }).kind,
    ).toBe('conflict')
  })
})
