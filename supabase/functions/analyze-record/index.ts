import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { generateGeminiText, parseJsonResponse } from '../_shared/gemini.ts'

const SYSTEM_PROMPT = `당신은 MY CHAPTER의 기록 분석 편집자입니다.
사용자가 실제로 작성한 한 개의 기록만 분석해 책 구성에 활용할 구조화 데이터를 만드세요.

절대 규칙:
- 기록에 없는 사실, 인물, 장소, 사건, 감정, 원인과 결과를 만들지 않습니다.
- 불확실하면 빈 배열 또는 null을 사용합니다.
- 요약은 판단이나 조언이 아니라 기록의 핵심 내용만 담습니다.
- themes는 반복될 수 있는 주제어, people/places는 기록에 실제로 등장한 대상만 담습니다.
- events는 책의 장면이나 사건으로 활용할 수 있는 실제 행동/상황을 짧게 정리합니다.
- conflict/change/insight는 기록에 분명히 드러날 때만 작성합니다.

JSON만 반환:
{
  "summary":"2~4문장 요약",
  "themes":["주제"],
  "people":["인물/관계"],
  "places":["장소"],
  "emotions":["감정"],
  "events":["실제 사건/장면"],
  "conflict":"갈등 또는 null",
  "change":"변화 또는 null",
  "insight":"기록에서 실제 드러난 깨달음 또는 null",
  "goals":["명시된 목표"]
}`

type AnalysisResult = {
  summary?: string
  themes?: unknown[]
  people?: unknown[]
  places?: unknown[]
  emotions?: unknown[]
  events?: unknown[]
  conflict?: string | null
  change?: string | null
  insight?: string | null
  goals?: unknown[]
}

function stringArray(value: unknown[] | undefined): string[] {
  return (value ?? []).filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
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

    const { record_id } = await req.json()
    if (!record_id) {
      return new Response(JSON.stringify({ error: 'record_id required' }), {
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

    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: record, error: recordError } = await admin
      .from('records')
      .select('id, project_id, user_id, mode, question_text, title, content, emotion_tags, created_at')
      .eq('id', record_id)
      .eq('user_id', user.id)
      .single()

    if (recordError || !record) {
      return new Response(JSON.stringify({ error: 'Record not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: project } = await admin
      .from('projects')
      .select('id, type, title')
      .eq('id', record.project_id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prompt = [
      `책 제목: ${project.title}`,
      `책 유형: ${project.type}`,
      `기록 날짜: ${record.created_at}`,
      `기록 방식: ${record.mode}`,
      `질문: ${record.question_text ?? '없음'}`,
      `제목: ${record.title ?? '없음'}`,
      `사용자 감정 태그: ${(record.emotion_tags ?? []).join(', ') || '없음'}`,
      '',
      '원본 기록:',
      record.content,
    ].join('\n')

    const aiText = await generateGeminiText({
      systemInstruction: SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 1200,
      json: true,
    })

    const parsed = aiText ? parseJsonResponse<AnalysisResult>(aiText) : null

    const payload = {
      record_id: record.id,
      project_id: record.project_id,
      user_id: user.id,
      summary: parsed?.summary?.trim() || record.content.slice(0, 500),
      themes: stringArray(parsed?.themes),
      people: stringArray(parsed?.people),
      places: stringArray(parsed?.places),
      emotions: stringArray(parsed?.emotions),
      events: stringArray(parsed?.events),
      conflict: parsed?.conflict?.trim() || null,
      change: parsed?.change?.trim() || null,
      insight: parsed?.insight?.trim() || null,
      goals: stringArray(parsed?.goals),
      model: 'gemini',
      schema_version: 1,
      analyzed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await admin
      .from('record_analysis')
      .upsert(payload, { onConflict: 'record_id' })

    if (upsertError) throw upsertError

    await admin.from('ai_usage').insert({
      user_id: user.id,
      feature: 'record_analysis',
      project_id: record.project_id,
    })

    return new Response(JSON.stringify({ success: true, analysis: payload }), {
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
