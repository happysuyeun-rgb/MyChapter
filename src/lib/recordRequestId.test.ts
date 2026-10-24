import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearRecordRequestId,
  getOrCreateRecordRequestId,
  mintNewRecordRequestId,
} from '@/lib/recordRequestId'

class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
}

describe('recordRequestId scoping', () => {
  beforeEach(() => {
    // @ts-expect-error test polyfill
    globalThis.sessionStorage = new MemoryStorage()
  })

  it('reuses the same id for the same user/project/mode', () => {
    const a = getOrCreateRecordRequestId('u1', 'p1', 'free')
    const b = getOrCreateRecordRequestId('u1', 'p1', 'free')
    expect(a).toBe(b)
  })

  it('isolates ids across user, project, and mode', () => {
    const base = getOrCreateRecordRequestId('u1', 'p1', 'free')
    expect(getOrCreateRecordRequestId('u2', 'p1', 'free')).not.toBe(base)
    expect(getOrCreateRecordRequestId('u1', 'p2', 'free')).not.toBe(base)
    expect(getOrCreateRecordRequestId('u1', 'p1', 'photo')).not.toBe(base)
  })

  it('mintNewRecordRequestId only after explicit new-save choice', () => {
    const first = getOrCreateRecordRequestId('u1', 'p1', 'question')
    const minted = mintNewRecordRequestId('u1', 'p1', 'question')
    expect(minted).not.toBe(first)
    expect(getOrCreateRecordRequestId('u1', 'p1', 'question')).toBe(minted)
  })

  it('clear removes the scoped id', () => {
    const first = getOrCreateRecordRequestId('u1', 'p1', 'free')
    clearRecordRequestId('u1', 'p1', 'free')
    const next = getOrCreateRecordRequestId('u1', 'p1', 'free')
    expect(next).not.toBe(first)
  })
})
