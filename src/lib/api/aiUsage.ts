import { isDevBypass } from '@/lib/devBypass'
import { supabase } from '@/lib/supabase'

export type AiUsageSummary = {
  plan: 'free' | 'pro'
  usedThisMonth: number
  monthlyLimit: number | null
  features: Array<{ key: string; label: string; count: number }>
}

const FREE_MONTHLY_LIMIT = 10

function monthStartIso() {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  return monthStart.toISOString()
}

export async function getAiUsageSummary(userId: string, plan: 'free' | 'pro'): Promise<AiUsageSummary> {
  if (isDevBypass()) {
    return {
      plan,
      usedThisMonth: plan === 'pro' ? 3 : 4,
      monthlyLimit: plan === 'pro' ? null : FREE_MONTHLY_LIMIT,
      features: [
        { key: 'question', label: 'AI 질문', count: plan === 'pro' ? 2 : 3 },
        { key: 'freewriting_hint', label: '자유 기록 힌트', count: plan === 'pro' ? 1 : 1 },
      ],
    }
  }

  // `ai_usage` exists in remote schema; local Database types omit it for now.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any
  const { data, error } = await client
    .from('ai_usage')
    .select('feature')
    .eq('user_id', userId)
    .in('feature', ['question', 'freewriting_hint'])
    .gte('created_at', monthStartIso())

  if (error) throw error

  const rows = (data ?? []) as Array<{ feature: string }>
  const featureCount = (key: string) => rows.filter((row) => row.feature === key).length

  return {
    plan,
    usedThisMonth: rows.length,
    monthlyLimit: plan === 'pro' ? null : FREE_MONTHLY_LIMIT,
    features: [
      { key: 'question', label: 'AI 질문', count: featureCount('question') },
      { key: 'freewriting_hint', label: '자유 기록 힌트', count: featureCount('freewriting_hint') },
    ],
  }
}
