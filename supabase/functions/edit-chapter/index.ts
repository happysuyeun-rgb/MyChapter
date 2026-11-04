import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { isActiveProPlan } from '../_shared/coverEntitlement.ts'
import { parseJsonResponse, tryGenerateGeminiText } from '../_shared/gemini.ts'

/** PD-017. Pro fair-use is provisional until the open decision closes. */
const FREE_MONTHLY_LIMIT = 3
const PRO_MONTHLY_FAIR_USE = 100
const MIN_TEXT_LENGTH = 50
const MAX_TEXT_LENGTH = 8000

const SYSTEM_INSTRUCTION = [
  '당신은 개인 회고록 편집자 PAGE입니다.',
  '작가가 쓴 챕터 원고를 다듬되 다음을 반드시 지키세요.',
  '- 사실, 사건, 인물, 장소, 감정을 바꾸거나 새로 만들지 않는다.',
  '- 1인칭 시점과 작가의 말투를 유지한다.',
  '- 맞춤법, 띄어쓰기, 어색한 문장, 불필요한 반복만 정리한다.',
  '- 분량은 원문과 비슷하게 유지하고 문단 구분을 보존한다.',
  'JSON으로만 답하세요: {"text": "다듬은 원고", "notes": ["무엇을 다듬었는지 한 줄", "..."]}',
  'notes는 1~3개, 각 40자 이내 한국어.',
].join('\n')

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const { chapter_id, text } = await req.json()
    const source = typeof text === 'string' ? text.trim() : ''
    if (!chapter_id || source.length < MIN_TEXT_LENGTH) {
      return json({ code: 'TEXT_TOO_SHORT', error: `${MIN_TEXT_LENGTH}자 이상 쓴 원고만 다듬을 수 있어요.` }, 400)
    }
    if (source.length > MAX_TEXT_LENGTH) {
      return json({ code: 'TEXT_TOO_LONG', error: `한 번에 ${MAX_TEXT_LENGTH.toLocaleString()}자까지 다듬을 수 있어요.` }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: chapter } = await admin
      .from('chapters')
      .select('id, project_id')
      .eq('id', chapter_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!chapter) return json({ error: 'Chapter not found' }, 404)

    const { data: subscription } = await admin
      .from('subscriptions')
      .select('plan, expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
    const isPro = isActiveProPlan(subscription?.plan, subscription?.expires_at)
    const limit = isPro ? PRO_MONTHLY_FAIR_USE : FREE_MONTHLY_LIMIT

    const monthStart = new Date()
    monthStart.setUTCDate(1)
    monthStart.setUTCHours(0, 0, 0, 0)

    const { count } = await admin
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('feature', 'ai_edit')
      .gte('created_at', monthStart.toISOString())

    const used = count ?? 0
    if (used >= limit) {
      return json({ code: 'AI_LIMIT', error: '이번 달 AI 편집 횟수를 모두 사용했어요.', remaining: 0, plan: isPro ? 'pro' : 'free' }, 402)
    }

    const result = await tryGenerateGeminiText({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: `다음 원고를 다듬어주세요.\n\n${source}`,
      maxOutputTokens: 8192,
      json: true,
    })

    const parsed = result.ok ? parseJsonResponse<{ text?: unknown; notes?: unknown }>(result.text) : null
    const edited = typeof parsed?.text === 'string' ? parsed.text.trim() : ''
    if (!edited) {
      // Failed generations never consume quota.
      return json({ code: 'AI_UNAVAILABLE', error: 'PAGE가 원고를 다듬지 못했어요. 잠시 후 다시 시도해주세요.' }, 503)
    }

    const notes = Array.isArray(parsed?.notes)
      ? parsed.notes.filter((note): note is string => typeof note === 'string' && note.trim() !== '').slice(0, 3)
      : []

    await admin.from('ai_usage').insert({
      user_id: user.id,
      feature: 'ai_edit',
      project_id: chapter.project_id,
    })

    return json({ text: edited, notes, remaining: Math.max(0, limit - used - 1), plan: isPro ? 'pro' : 'free' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ error: message }, 500)
  }
})
