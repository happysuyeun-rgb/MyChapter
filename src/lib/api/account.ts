import { resolveFunctionPayload } from '@/lib/api/functionInvoke'
import { isDevBypass } from '@/lib/devBypass'
import { supabase } from '@/lib/supabase'

export async function deleteAccount(): Promise<void> {
  if (isDevBypass()) return

  const response = await supabase.functions.invoke('delete-account', {
    body: { confirm: true },
  })

  const { data, errorBody, error } = await resolveFunctionPayload<{ error?: string }>(response)
  const message = errorBody?.error ?? data?.error

  if (error || message) {
    throw new Error(message ?? '계정 삭제에 실패했어요.')
  }
}
