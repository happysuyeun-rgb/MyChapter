import { supabase } from '@/lib/supabase'

export async function deleteAccount(): Promise<void> {
  const response = await supabase.functions.invoke('delete-account', {
    body: { confirm: true },
  })

  if (response.error) {
    throw new Error('계정 삭제에 실패했어요.')
  }

  const body = response.data as { error?: string } | null
  if (body?.error) {
    throw new Error(body.error)
  }
}
