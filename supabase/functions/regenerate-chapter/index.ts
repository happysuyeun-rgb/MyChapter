import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { generateGeminiText, parseJsonResponse } from '../_shared/gemini.ts'

const SYSTEM_PROMPT = `사용자 일기 기록을 에세이로 재구성하세요.
JSON만 응답: {"chapter_title":"제목","chapter_content":"본문"}`

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

    const { chapter_id } = await req.json()
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

    const { data: chapter } = await admin
      .from('chapters')
      .select('*')
      .eq('id', chapter_id)
      .eq('user_id', user.id)
      .single()

    if (!chapter) {
      return new Response(JSON.stringify({ error: 'Chapter not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: records } = await admin
      .from('records')
      .select('content, emotion_tags')
      .in('id', chapter.record_ids)

    const recordsText = (records ?? [])
      .map((r, i) => `[${i + 1}] ${r.content}`)
      .join('\n')

    let title = chapter.title
    let content = chapter.ai_content ?? ''

    if (recordsText) {
      const aiText = await generateGeminiText({
        systemInstruction: SYSTEM_PROMPT,
        prompt: recordsText,
        maxOutputTokens: 2048,
        json: true,
      })

      if (aiText) {
        const parsed = parseJsonResponse<{ chapter_title?: string; chapter_content?: string }>(aiText)
        if (parsed) {
          title = parsed.chapter_title ?? title
          content = parsed.chapter_content ?? content
        } else {
          content = aiText || content
        }
      }
    }

    const { data: updated, error } = await admin
      .from('chapters')
      .update({ ai_content: content, user_content: null, title })
      .eq('id', chapter_id)
      .select()
      .single()

    if (error) throw error

    await admin.from('ai_usage').insert({
      user_id: user.id,
      feature: 'chapter_regenerate',
      project_id: chapter.project_id,
    })

    return new Response(JSON.stringify(updated), {
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
