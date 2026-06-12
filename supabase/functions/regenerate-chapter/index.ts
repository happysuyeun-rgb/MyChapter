import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (anthropicKey && recordsText) {
      const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: recordsText }],
        }),
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        const text = aiData?.content?.[0]?.text?.trim() ?? ''
        try {
          const parsed = JSON.parse(text)
          title = parsed.chapter_title ?? title
          content = parsed.chapter_content ?? content
        } catch {
          content = text || content
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
