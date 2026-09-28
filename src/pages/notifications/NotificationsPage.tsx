import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, FlatIcon } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import {
  listNotifications,
  markAllRead,
  markAsRead,
  type AppNotification,
} from '@/lib/api/notifications'
import { useAuthStore } from '@/stores/authStore'

const TYPE_LABEL: Record<string, string> = {
  daily_question: 'RECORD',
  badge: 'MILESTONE',
  chapter_complete: 'CHAPTER',
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
    try {
      const data = await listNotifications(user.id)
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const handleTap = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
      setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, is_read: true } : n))
    }
    if (notification.link) navigate(notification.link)
  }

  const handleMarkAll = async () => {
    if (!user) return
    await markAllRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar
        title="알림"
        leftLabel="←"
        rightLabel={unreadCount > 0 ? '모두 읽음' : undefined}
        onRightClick={unreadCount > 0 ? () => void handleMarkAll() : undefined}
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">로딩 중...</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center px-7">
          <div className="border-y border-ink py-8">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">ACTIVITY</p>
              <FlatIcon name="book" size={25} className="text-sage" />
            </div>
            <h1 className="mt-5 font-serif text-[24px] font-bold">아직 도착한 알림이 없어요.</h1>
            <p className="mt-3 text-sm leading-6 text-ink-muted">기록할 시간이나 책 만들기의 다음 단계를 PAGE가 알려드릴게요.</p>
          </div>
          <Button className="mt-7" variant="secondary" onClick={() => navigate('/home')}>홈으로 돌아가기</Button>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto px-5 pb-10 pt-6">
          <header className="flex items-end justify-between border-b border-ink pb-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">ACTIVITY LOG</p>
              <h1 className="mt-2 font-serif text-[25px] font-bold">PAGE의 알림</h1>
            </div>
            <span className="text-xs text-ink-faint">미확인 {unreadCount}</span>
          </header>

          <div>
            {notifications.map((notification, index) => (
              <button
                key={notification.id}
                type="button"
                className="group flex w-full gap-4 border-b border-border py-5 text-left"
                onClick={() => void handleTap(notification)}
              >
                <span className="w-7 shrink-0 font-serif text-xs text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-semibold tracking-[0.15em] text-sage">{TYPE_LABEL[notification.type] ?? 'NOTICE'}</p>
                    {!notification.is_read && <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />}
                  </div>
                  <p className="mt-2 text-sm font-semibold">{notification.title}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">{notification.body}</p>
                  <p className="mt-2 text-[10px] text-ink-faint">{formatRelativeTime(notification.created_at)}</p>
                </div>
                <span className="pt-4 text-lg text-ink-faint transition-transform group-active:translate-x-1">→</span>
              </button>
            ))}
          </div>
        </main>
      )}
    </div>
  )
}
