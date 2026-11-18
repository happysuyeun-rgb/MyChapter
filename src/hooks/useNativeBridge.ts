import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { clearAuthRedirectParams, handleAuthCallback, parseAuthRedirectError } from '@/lib/authCallback'
import { resolveDeepLinkPath } from '@/lib/deeplink'
import { initPushNotifications, resetPushState } from '@/lib/push'
import { useAuthStore } from '@/stores/authStore'

export function useNativeBridge() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleUrl = async (url: string) => {
      const authError = parseAuthRedirectError(url)
      if (authError) {
        clearAuthRedirectParams(url)
        navigate('/login', { replace: true, state: { authError } })
        return
      }

      const looksLikeAuth = url.includes('access_token') || url.includes('code=')
      const authed = await handleAuthCallback(url)
      if (authed) {
        navigate('/home', { replace: true })
        return
      }
      if (looksLikeAuth) {
        navigate('/login', {
          replace: true,
          state: { authError: '로그인 세션을 만들지 못했어요. 다시 시도해주세요.' },
        })
        return
      }

      const path = resolveDeepLinkPath(url)
      if (path) navigate(path)
    }

    const launchListener = App.addListener('appUrlOpen', (event) => {
      handleUrl(event.url)
    })

    void App.getLaunchUrl().then((result) => {
      if (result?.url) handleUrl(result.url)
    })

    return () => {
      void launchListener.then((l) => l.remove())
    }
  }, [navigate])

  useEffect(() => {
    if (!user || !profile?.notification_enabled) {
      resetPushState()
      return
    }

    void initPushNotifications(user.id, (path) => navigate(path))
  }, [user, profile?.notification_enabled, navigate])
}
