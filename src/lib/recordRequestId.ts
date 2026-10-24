// Preserve the identity of an ambiguous create request across page reloads.
// Store only a UUID, never the user's record content.
const PREFIX = 'mychapter:record-create:'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

function key(userId: string, projectId: string, mode: string): string {
  return PREFIX + [userId, projectId, mode].join(':')
}

export function getOrCreateRecordRequestId(userId: string, projectId: string, mode: string): string {
  const storageKey = key(userId, projectId, mode)
  try {
    const stored = sessionStorage.getItem(storageKey)
    if (stored) {
      const parsed = JSON.parse(stored) as { id?: string; createdAt?: number }
      if (typeof parsed.id === 'string' && /^[0-9a-f-]{36}$/i.test(parsed.id) &&
          typeof parsed.createdAt === 'number' && Date.now() - parsed.createdAt < MAX_AGE_MS) {
        return parsed.id
      }
    }
    const id = crypto.randomUUID()
    sessionStorage.setItem(storageKey, JSON.stringify({ id, createdAt: Date.now() }))
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export function clearRecordRequestId(userId: string, projectId: string, mode: string): void {
  try { sessionStorage.removeItem(key(userId, projectId, mode)) } catch { /* storage unavailable */ }
}

/** Explicit "save as a new record" — never call on automatic conflict recovery. */
export function mintNewRecordRequestId(userId: string, projectId: string, mode: string): string {
  clearRecordRequestId(userId, projectId, mode)
  return getOrCreateRecordRequestId(userId, projectId, mode)
}
