import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { upsertDeviceToken } from '@/lib/api/deviceTokens'

let initialized = false
let lastFcmToken: string | null = null

export function getLastFcmToken(): string | null {
  return lastFcmToken
}

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

  if (Capacitor.getPlatform() === 'android') {
    // send-daily-reminder Edge Function sends with channelId: 'daily_reminder'.
    // On Android 8+, a notification sent to a channel that doesn't exist on
    // the device is silently dropped, so this channel must be created before
    // the first push arrives.
    try {
      await PushNotifications.createChannel({
        id: 'daily_reminder',
        name: '오늘의 질문 알림',
        description: '매일 기록을 남기라는 리마인더 알림입니다.',
        importance: 4,
        visibility: 0,
        vibration: true,
      })
    } catch (err) {
      console.error('Push channel create error:', err)
    }
  }

  await PushNotifications.addListener('registration', (token) => {
    lastFcmToken = token.value
    void upsertDeviceToken(userId, token.value).catch((err) => {
      console.error('Push token upsert error:', err)
    })
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
  lastFcmToken = null
}
