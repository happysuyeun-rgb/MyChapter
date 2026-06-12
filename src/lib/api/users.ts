import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types/database'

export async function updateNickname(userId: string, nickname: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .update({ nickname })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProfileEmoji(userId: string, profileEmoji: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .update({ profile_emoji: profileEmoji })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateNotificationSettings(
  userId: string,
  settings: { notification_enabled?: boolean; notification_time?: string },
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .update(settings)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
