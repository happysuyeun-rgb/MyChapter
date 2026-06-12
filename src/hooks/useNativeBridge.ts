import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { handleAuthCallback } from '@/lib/authCallback'
import { resolveDeepLinkPath } from '@/lib/deeplink'
import { initPushNotifications, resetPushState } from '@/lib/push'
import { useAuthStore } from '@/stores/authStore'

export function useNativeBridge() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleUrl = async (url: string) => {
      const authed = await handleAuthCallback(url)
      if (authed) {
        navigate('/home', { replace: true })
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
