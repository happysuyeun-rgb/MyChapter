/**
 * Simulates createRecord conflict policy without Supabase:
 * - same request twice → 1 row
 * - lost response retry → 1 row
 * - body edit under same id → conflict (no auto insert)
 * - explicit mint → 2nd row
 * - lookup failure → no insert
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { resolveInsertFailure, type CreatePayloadCompare } from '@/lib/recordCreatePolicy'
import type { JournalRecord } from '@/types/database'

class CreateStore {
  rows = new Map<string, JournalRecord>()
  lookupBroken = false

  create(input: CreatePayloadCompare & { requestId: string }): JournalRecord | { conflict: JournalRecord } | { lookupFailed: true } | { error: string } {
    const id = input.requestId
    if (this.rows.has(id)) {
      // Simulate unique violation then lookup
      if (this.lookupBroken) return { lookupFailed: true }
      const existing = this.rows.get(id)!
      const resolution = resolveInsertFailure({
        existing,
        lookupFailed: false,
        input,
      })
      if (resolution.kind === 'reuse') return existing
      if (resolution.kind === 'conflict') return { conflict: existing }
      return { error: 'unknown' }
    }

    // Simulate insert succeeded but response lost: row exists after "network" blip
    const row: JournalRecord = {
      id,
      project_id: input.projectId,
      user_id: input.userId,
      record_number: this.rows.size + 1,
      chapter_id: null,
      mode: input.mode,
      content: input.content,
      question_text: input.questionText ?? null,
      title: input.title ?? null,
      photo_url: input.photoUrl ?? null,
      emotion_tags: input.emotionTags,
      is_draft: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.rows.set(id, row)
    return row
  }

  /** First call inserts but returns transport failure; second call hits unique path. */
  createWithLostResponse(input: CreatePayloadCompare & { requestId: string }) {
    const inserted = this.create(input)
    if ('id' in inserted) {
      // pretend client never saw success — next call reuses same requestId
      return { lost: true as const, row: inserted }
    }
    return inserted
  }
}

describe('in-memory create store (policy integration)', () => {
  let store: CreateStore

  beforeEach(() => {
    store = new CreateStore()
  })

  const base = {
    userId: 'u1',
    projectId: 'p1',
    mode: 'free' as const,
    content: 'ten chars..',
    title: 't',
    emotionTags: [] as string[],
    requestId: '11111111-1111-1111-1111-111111111111',
  }

  it('same request twice → one record', () => {
    store.create(base)
    const second = store.create(base)
    expect('id' in second && second.id).toBe(base.requestId)
    expect(store.rows.size).toBe(1)
  })

  it('DB success + lost response → retry still one record', () => {
    const lost = store.createWithLostResponse(base)
    expect('lost' in lost && lost.lost).toBe(true)
    const retry = store.create(base)
    expect('id' in retry).toBe(true)
    expect(store.rows.size).toBe(1)
  })

  it('body edit under same request id → conflict, no second row', () => {
    store.create(base)
    const edited = store.create({ ...base, content: 'changed body!' })
    expect('conflict' in edited).toBe(true)
    expect(store.rows.size).toBe(1)
  })

  it('explicit new request id → second record', () => {
    store.create(base)
    store.create({
      ...base,
      content: 'another page!!',
      requestId: '22222222-2222-2222-2222-222222222222',
    })
    expect(store.rows.size).toBe(2)
  })

  it('lookup failure → no automatic new insert', () => {
    store.create(base)
    store.lookupBroken = true
    const result = store.create({ ...base, content: 'changed body!' })
    expect(result).toEqual({ lookupFailed: true })
    expect(store.rows.size).toBe(1)
  })

  it('question change with same body → conflict (preserve save-time question)', () => {
    const qBase = {
      ...base,
      mode: 'question' as const,
      questionText: 'Q1',
      requestId: '33333333-3333-3333-3333-333333333333',
    }
    store.create(qBase)
    const changedQ = store.create({ ...qBase, questionText: 'Q2' })
    expect('conflict' in changedQ).toBe(true)
    expect(store.rows.size).toBe(1)
    const row = store.rows.get(qBase.requestId)!
    expect(row.question_text).toBe('Q1')
  })
})
