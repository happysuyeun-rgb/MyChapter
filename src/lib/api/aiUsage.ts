import { AI_EDIT_FREE_MONTHLY_LIMIT, getAiEditUsedThisMonth } from '@/lib/api/aiEdit'
import { isDevBypass } from '@/lib/devBypass'
import { supabase } from '@/lib/supabase'

export type AiUsageSummary = {
  plan: 'free' | 'pro'
  usedThisMonth: number
  monthlyLimit: number | null
  /** `limit` is set only for features with their own Free quota (AI 편집). */
  features: Array<{ key: string; label: string; count: number; limit?: number | null }>
}

const FREE_MONTHLY_LIMIT = 10

function monthStartIso() {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  return monthStart.toISOString()
}

export async function getAiUsageSummary(userId: string, plan: 'free' | 'pro'): Promise<AiUsageSummary> {
  const editLimit = plan === 'pro' ? null : AI_EDIT_FREE_MONTHLY_LIMIT

  if (isDevBypass()) {
    return {
      plan,
      usedThisMonth: plan === 'pro' ? 3 : 4,
      monthlyLimit: plan === 'pro' ? null : FREE_MONTHLY_LIMIT,
      features: [
        { key: 'question', label: 'AI 질문', count: plan === 'pro' ? 2 : 3 },
        { key: 'freewriting_hint', label: '자유 기록 힌트', count: plan === 'pro' ? 1 : 1 },
        { key: 'ai_edit', label: 'AI 편집', count: await getAiEditUsedThisMonth(userId), limit: editLimit },
      ],
    }
  }

  // `ai_usage` exists in remote schema; local Database types omit it for now.
  // No feature filter: `ai_edit` is not a valid enum literal until migration 026 is applied.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any
  const { data, error } = await client
    .from('ai_usage')
    .select('feature')
    .eq('user_id', userId)
    .gte('created_at', monthStartIso())

  if (error) throw error

  const rows = (data ?? []) as Array<{ feature: string }>
  const featureCount = (key: string) => rows.filter((row) => row.feature === key).length

  return {
    plan,
    usedThisMonth: featureCount('question') + featureCount('freewriting_hint'),
    monthlyLimit: plan === 'pro' ? null : FREE_MONTHLY_LIMIT,
    features: [
      { key: 'question', label: 'AI 질문', count: featureCount('question') },
      { key: 'freewriting_hint', label: '자유 기록 힌트', count: featureCount('freewriting_hint') },
      { key: 'ai_edit', label: 'AI 편집', count: featureCount('ai_edit'), limit: editLimit },
    ],
  }
}
