import { supabase } from '@/lib/supabase'
import type { NotificationType } from '@/types/database'
import type { BadgeEvent } from '@/utils/badges'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

export async function listNotifications(
  userId: string,
  limit = 30,
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}

export async function createBadgeNotifications(
  userId: string,
  badges: BadgeEvent[],
): Promise<void> {
  for (const badge of badges) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('title', badge.title)

    if ((count ?? 0) > 0) continue

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'badge',
      title: badge.title,
      body: badge.body,
      link: '/home',
    })
  }
}
