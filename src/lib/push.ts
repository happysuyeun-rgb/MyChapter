import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { upsertDeviceToken } from '@/lib/api/deviceTokens'

let initialized = false

export async function initPushNotifications(
  userId: string,
  onNavigate: (path: string) => void,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return

  const permission = await PushNotifications.checkPermissions()
  if (permission.receive === 'prompt') {
    const requested = await PushNotifications.requestPermissions()
    if (requested.receive !== 'granted') return
  } else if (permission.receive !== 'granted') {
    return
  }

  await PushNotifications.addListener('registration', (token) => {
    void upsertDeviceToken(userId, token.value)
  })

  await PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error:', err)
  })

  await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const link = action.notification.data?.link
    if (typeof link === 'string' && link.startsWith('/')) {
      onNavigate(link)
    }
  })

  await PushNotifications.register()
  initialized = true
}

export function resetPushState(): void {
  initialized = false
}
