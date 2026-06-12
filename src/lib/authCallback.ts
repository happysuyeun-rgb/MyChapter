import { supabase } from '@/lib/supabase'

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
