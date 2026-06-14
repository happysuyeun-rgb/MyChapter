import type { AppNotification } from '@/lib/api/notifications'
import { mockNowIso, mockStore, newMockId } from '@/mocks/state'
import type { BadgeEvent } from '@/utils/badges'

export function mockListNotifications(_userId: string, limit = 30): AppNotification[] {
  return [...mockStore.notifications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
}

export function mockGetUnreadCount(_userId: string): number {
  return mockStore.notifications.filter((n) => !n.is_read).length
}

export function mockMarkAsRead(notificationId: string): void {
  const notification = mockStore.notifications.find((n) => n.id === notificationId)
  if (notification) notification.is_read = true
}

export function mockMarkAllRead(_userId: string): void {
  for (const notification of mockStore.notifications) {
    notification.is_read = true
  }
}

export async function mockCreateBadgeNotifications(
  _userId: string,
  badges: BadgeEvent[],
): Promise<void> {
  for (const badge of badges) {
    const exists = mockStore.notifications.some((n) => n.title === badge.title)
    if (exists) continue

    mockStore.notifications.unshift({
      id: newMockId(),
      type: 'badge',
      title: badge.title,
      body: badge.body,
      link: '/home',
      is_read: false,
      created_at: mockNowIso(),
    })
  }
}
