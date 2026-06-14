export {
  DEV_MOCK_USER_ID,
  DEV_MOCK_PROJECT_ID,
  DEV_MOCK_USER,
  DEV_MOCK_SESSION,
  DEV_MOCK_PROFILE,
  DEV_MOCK_PROJECT,
  DEV_MOCK_TODAY_QUESTION,
} from '@/mocks/data'

export function getDevBypassEnv(): string | undefined {
  const value = import.meta.env.VITE_DEV_BYPASS
  if (value === undefined || value === null) return undefined
  const trimmed = String(value).trim()
  return trimmed === '' ? undefined : trimmed
}

/** Vite inlines VITE_* at build time — Vercel env changes require a redeploy. */
export function isDevBypass(): boolean {
  const raw = getDevBypassEnv()
  if (!raw) return false
  const normalized = raw.toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}
