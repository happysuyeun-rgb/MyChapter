import { supabase } from '@/lib/supabase'

function readAuthParams(url: string): URLSearchParams {
  const parsed = new URL(url)
  const fromSearch = parsed.searchParams
  const fromHash = parsed.hash
    ? new URLSearchParams(parsed.hash.replace(/^#/, ''))
    : new URLSearchParams()

  const merged = new URLSearchParams(fromSearch)
  for (const [key, value] of fromHash.entries()) {
    if (!merged.has(key)) merged.set(key, value)
  }
  return merged
}

/** Map IdP/Supabase error codes to fixed Korean copy. Never echo raw error_description. */
export function formatAuthRedirectError(error: string | null, _errorDescription?: string | null): string {
  const code = (error ?? '').toLowerCase()
  if (code === 'access_denied' || code === 'user_cancelled' || code === 'canceled' || code === 'cancelled') {
    return '로그인이 취소됐어요. 다시 시도해주세요.'
  }
  if (code === 'otp_expired' || code === 'expired' || code.includes('expired')) {
    return '로그인 링크가 만료됐어요. 이메일을 다시 받아주세요.'
  }
  return '로그인하지 못했어요. 다시 시도해주세요.'
}

export function parseAuthRedirectError(url: string = typeof window !== 'undefined' ? window.location.href : ''): string | null {
  if (!url) return null
  try {
    const params = readAuthParams(url)
    const error = params.get('error') ?? params.get('error_code')
    if (!error) return null
    return formatAuthRedirectError(error, params.get('error_description'))
  } catch {
    return null
  }
}

export function clearAuthRedirectParams(url: string = typeof window !== 'undefined' ? window.location.href : ''): void {
  if (typeof window === 'undefined' || !url) return
  try {
    const parsed = new URL(url)
    const keys = ['error', 'error_code', 'error_description', 'error_uri']
    let changed = false
    for (const key of keys) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.delete(key)
        changed = true
      }
    }
    if (parsed.hash) {
      const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''))
      for (const key of keys) {
        if (hashParams.has(key)) {
          hashParams.delete(key)
          changed = true
        }
      }
      const nextHash = hashParams.toString()
      parsed.hash = nextHash ? `#${nextHash}` : ''
    }
    if (changed) {
      window.history.replaceState(window.history.state, '', `${parsed.pathname}${parsed.search}${parsed.hash}`)
    }
  } catch {
    // ignore
  }
}

export async function handleAuthCallback(url: string): Promise<boolean> {
  if (!url.includes('access_token') && !url.includes('code=')) {
    return false
  }

  try {
    const parsed = new URL(url)

    if (parsed.hash) {
      const params = new URLSearchParams(parsed.hash.replace(/^#/, ''))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        return !error
      }
    }

    const code = parsed.searchParams.get('code')
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      return !error
    }
  } catch {
    return false
  }

  return false
}
