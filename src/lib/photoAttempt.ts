const prefix = 'mychapter:photo-attempt:'
const ttl = 24 * 60 * 60 * 1000
function key(userId: string, projectId: string) { return prefix + userId + ':' + projectId }
export function loadPhotoAttempt(userId: string, projectId: string, requestId: string): string | null {
  try {
    const raw = sessionStorage.getItem(key(userId, projectId))
    if (!raw) return null
    const data = JSON.parse(raw) as { requestId?: string; path?: string; at?: number }
    const expectedPrefix = userId + '/' + projectId + '/'
    if (data.requestId === requestId && typeof data.path === 'string' &&
        data.path.startsWith(expectedPrefix) && typeof data.at === 'number' &&
        Date.now() - data.at < ttl) return data.path
  } catch { /* unavailable */ }
  return null
}
export function savePhotoAttempt(userId: string, projectId: string, requestId: string, path: string) {
  if (!path.startsWith(userId + '/' + projectId + '/')) return
  try { sessionStorage.setItem(key(userId, projectId), JSON.stringify({ requestId, path, at: Date.now() })) } catch { /* unavailable */ }
}
export function clearPhotoAttempt(userId: string, projectId: string) {
  try { sessionStorage.removeItem(key(userId, projectId)) } catch { /* unavailable */ }
}
