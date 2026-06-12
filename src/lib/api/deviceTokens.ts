import { supabase } from '@/lib/supabase'

export async function upsertDeviceToken(
  userId: string,
  fcmToken: string,
  platform: 'android' | 'ios' = 'android',
): Promise<void> {
  const { error } = await supabase.from('device_tokens').upsert(
    {
      user_id: userId,
      fcm_token: fcmToken,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,fcm_token' },
  )

  if (error) throw error
}

export async function removeDeviceToken(userId: string, fcmToken: string): Promise<void> {
  const { error } = await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('fcm_token', fcmToken)

  if (error) throw error
}
