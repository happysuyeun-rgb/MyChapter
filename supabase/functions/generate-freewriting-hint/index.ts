import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { generateGeminiText, stripQuotes } from '../_shared/gemini.ts'

const FALLBACK_HINTS: Record<string, string> = {
  emotion: '오늘 하루 중 예상과 달랐던 순간을 떠올려보세요.',
  parenting: '오늘 아이와 나눈 작은 대화가 떠오르나요?',
  yearly: '올해 초의 나와 지금의 나, 무엇이 달라졌나요?',
  career: '오늘 나를 가장 긴장하게 한 순간은 무엇이었나요?',
  custom: '오늘 하루를 한 문장으로 표현한다면?',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { project_id } = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: project } = await adminClient
      .from('projects')
      .select('type')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: subscription } = await adminClient
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle()

    const isPro = subscription?.plan === 'pro'

    if (!isPro) {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { count } = await adminClient
        .from('ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('feature', ['question', 'freewriting_hint'])
        .gte('created_at', monthStart.toISOString())

      if ((count ?? 0) >= 10) {
        return new Response(JSON.stringify({ code: 'AI_LIMIT', error: 'Monthly limit reached' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const { data: recentRecords } = await adminClient
      .from('records')
      .select('emotion_tags, created_at')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false })
      .limit(3)

    let hint = FALLBACK_HINTS[project.type] ?? FALLBACK_HINTS.emotion

    const emotions = (recentRecords ?? [])
      .flatMap((r) => r.emotion_tags ?? [])
      .join(', ')

    const aiText = await generateGeminiText({
      systemInstruction: '자유 일기 글감을 1문장으로 제안하세요. 한국어 경어, 따옴표 없이.',
      prompt: `프로젝트 유형: ${project.type}\n최근 감정: ${emotions || '없음'}`,
      maxOutputTokens: 128,
    })

    if (aiText) {
      hint = stripQuotes(aiText)
    }

    await adminClient.from('ai_usage').insert({
      user_id: user.id,
      feature: 'freewriting_hint',
      project_id,
    })

    return new Response(JSON.stringify({ hint }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
