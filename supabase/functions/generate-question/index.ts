import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { generateGeminiText, stripQuotes } from '../_shared/gemini.ts'

const FALLBACK_QUESTIONS: Record<string, string> = {
  emotion: '오늘 하루 중 가장 선명하게 남는 감정의 순간은 언제인가요?',
  parenting: '오늘 아이와 함께한 순간 중 가장 기억에 남는 장면은 무엇인가요?',
  yearly: '올해의 나에게 고마웠던 작은 순간은 무엇인가요?',
  career: '오늘 새로운 도전을 향해 내딛은 한 걸음이 있었나요?',
  custom: '오늘 하루를 돌아보며 가장 먼저 떠오르는 생각은 무엇인가요?',
}

const SYSTEM_PROMPT = `당신은 따뜻한 기록 코치입니다.
사용자의 프로젝트 유형과 최근 기록 맥락을 바탕으로 오늘의 질문 1개를 생성하세요.

규칙:
- 한국어 경어 사용 (반말 금지)
- 1문장, 따옴표 없이 텍스트만 반환
- 평균 답변 시간 2분 이내로 유도하는 가벼운 질문
- 너무 철학적이거나 무거운 질문 지양
- 프로젝트 유형에 맞는 구체적인 질문`

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
    if (!project_id) {
      return new Response(JSON.stringify({ error: 'project_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: project, error: projectError } = await adminClient
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const today = new Date().toISOString().slice(0, 10)

    const { data: cached } = await adminClient
      .from('daily_questions')
      .select('question')
      .eq('project_id', project_id)
      .eq('question_date', today)
      .maybeSingle()

    if (cached?.question) {
      return new Response(JSON.stringify({ question: cached.question }), {
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
      .select('content, emotion_tags, created_at')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false })
      .limit(3)

    const { count: recordCount } = await adminClient
      .from('records')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project_id)

    const recentEmotions = (recentRecords ?? [])
      .flatMap((r) => r.emotion_tags ?? [])
      .slice(0, 6)

    const recentContent = (recentRecords ?? [])
      .map((r) => r.content)
      .join(' ')
      .slice(0, 100)

    let question = FALLBACK_QUESTIONS[project.type] ?? FALLBACK_QUESTIONS.emotion

    const userPrompt = `프로젝트 유형: ${project.type}
프로젝트 제목: ${project.title}
현재까지 기록 수: ${recordCount ?? 0}
최근 감정 태그: ${recentEmotions.join(', ') || '없음'}
최근 기록 요약: ${recentContent || '없음'}`

    const aiText = await generateGeminiText({
      systemInstruction: SYSTEM_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 256,
    })

    if (aiText) {
      question = stripQuotes(aiText)
    }

    await adminClient.from('daily_questions').insert({
      project_id,
      user_id: user.id,
      question,
      question_date: today,
    })

    await adminClient.from('ai_usage').insert({
      user_id: user.id,
      feature: 'question',
      project_id,
    })

    return new Response(JSON.stringify({ question }), {
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
