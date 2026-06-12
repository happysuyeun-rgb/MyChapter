import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import {
  listNotifications,
  markAllRead,
  markAsRead,
  type AppNotification,
} from '@/lib/api/notifications'
import { useAuthStore } from '@/stores/authStore'

const TYPE_ICON: Record<string, string> = {
  daily_question: '✍️',
  badge: '🏅',
  chapter_complete: '📖',
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const data = await listNotifications(user.id)
    setNotifications(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const handleTap = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n,
        ),
      )
    }
    if (notification.link) {
      navigate(notification.link)
    }
  }

  const handleMarkAll = async () => {
    if (!user) return
    await markAllRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar
        title="알림"
        leftLabel="‹ 뒤로"
        rightLabel={unreadCount > 0 ? '모두 읽음' : undefined}
        onRightClick={unreadCount > 0 ? () => void handleMarkAll() : undefined}
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
          로딩 중...
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-4 text-5xl">🔔</div>
          <p className="text-sm text-ink-muted">아직 알림이 없어요</p>
          <Button className="mt-6" variant="secondary" onClick={() => navigate('/home')}>
            홈으로
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              className={[
                'flex w-full gap-3 border-b border-border px-5 py-4 text-left',
                notification.is_read ? 'bg-white' : 'bg-accent-light/40',
              ].join(' ')}
              onClick={() => void handleTap(notification)}
            >
              <span className="text-xl">{TYPE_ICON[notification.type] ?? '🔔'}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{notification.title}</p>
                  {!notification.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  )}
                </div>
                <p className="mt-0.5 text-sm text-ink-muted">{notification.body}</p>
                <p className="mt-1.5 text-xs text-ink-faint">
                  {formatRelativeTime(notification.created_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
