import { resolveFunctionPayload } from '@/lib/api/functionInvoke'
import { isDevBypass } from '@/lib/devBypass'
import { supabase } from '@/lib/supabase'

/** Off until migration 026 + `edit-chapter` are live; Vite inlines this at build time. */
export function isAiEditEnabled(): boolean {
  return isDevBypass() || import.meta.env.VITE_AI_EDIT_ENABLED === 'true'
}

export const AI_EDIT_FREE_MONTHLY_LIMIT = 3
export const AI_EDIT_MIN_LENGTH = 50
export const AI_EDIT_MAX_LENGTH = 8000

export interface AiEditResult {
  text: string
  notes: string[]
  remaining: number | null
}

export class AiEditError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

let mockUsed = 0

function mockEdit(text: string): AiEditResult {
  if (mockUsed >= AI_EDIT_FREE_MONTHLY_LIMIT) {
    throw new AiEditError('AI_LIMIT', '이번 달 AI 편집 횟수를 모두 사용했어요.')
  }
  mockUsed += 1
  const edited = text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/([.!?])(?=\S)/g, '$1 ')
    .trim()
  return {
    text: edited,
    notes: ['띄어쓰기와 문장 부호를 정리했어요.', '문단 사이 빈 줄을 맞췄어요.'],
    remaining: AI_EDIT_FREE_MONTHLY_LIMIT - mockUsed,
  }
}

export async function editChapterWithAi(chapterId: string, text: string): Promise<AiEditResult> {
  if (isDevBypass()) return mockEdit(text)

  const response = await supabase.functions.invoke('edit-chapter', {
    body: { chapter_id: chapterId, text },
  })
  const { data, errorBody, error } = await resolveFunctionPayload<{
    text?: string
    notes?: string[]
    remaining?: number
    plan?: string
    code?: string
    error?: string
  }>(response)

  const code = errorBody?.code ?? data?.code
  const message = (errorBody?.error as string | undefined) ?? data?.error
  if (code || error || !data?.text) {
    throw new AiEditError(code ?? 'AI_EDIT_FAILED', message ?? 'PAGE가 원고를 다듬지 못했어요. 잠시 후 다시 시도해주세요.')
  }

  return {
    text: data.text,
    notes: data.notes ?? [],
    remaining: data.plan === 'pro' ? null : data.remaining ?? null,
  }
}

/** UTC, matching the `edit-chapter` quota window. */
function monthStartIso() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

export async function getAiEditUsedThisMonth(userId: string): Promise<number> {
  if (isDevBypass()) return mockUsed

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
  return ((data ?? []) as Array<{ feature: string }>).filter((row) => row.feature === 'ai_edit').length
}
