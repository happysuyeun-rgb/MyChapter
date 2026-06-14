import { isDevBypass } from '@/lib/devBypass'
import {
  mockUpdateNickname,
  mockUpdateNotificationSettings,
  mockUpdateProfileEmoji,
} from '@/mocks'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types/database'

export async function updateNickname(userId: string, nickname: string): Promise<UserProfile> {
  if (isDevBypass()) return mockUpdateNickname(userId, nickname)

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
  if (isDevBypass()) return mockUpdateProfileEmoji(userId, profileEmoji)

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
  if (isDevBypass()) return mockUpdateNotificationSettings(userId, settings)

  const { data, error } = await supabase
    .from('users')
    .update(settings)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
