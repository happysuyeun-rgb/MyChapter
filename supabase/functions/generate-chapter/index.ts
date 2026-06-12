import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SYSTEM_PROMPT = `당신은 에세이 편집자입니다.
사용자의 일기 기록들을 자연스러운 에세이 문체로 재구성하세요.

규칙:
- 사용자의 원문 표현을 최대한 살릴 것
- "AI가 쓴 느낌" 지양
- 한국어 경어
- JSON 형식으로만 응답: {"chapter_title":"5~10자","chapter_content":"본문\\n\\n단락구분"}
- chapter_content는 마크다운 없이 순수 텍스트, 단락은 \\n\\n으로 구분
- 기록 10개 기준 600~800자`

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

    const { data: project } = await admin
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { count: chapterCount } = await admin
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project_id)
      .eq('is_complete', true)

    const { data: subscription } = await admin
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle()

    const isPro = subscription?.plan === 'pro'
    if (!isPro && (chapterCount ?? 0) >= 3) {
      return new Response(JSON.stringify({ code: 'CHAPTER_LIMIT' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: unassigned } = await admin
      .from('records')
      .select('id, content, emotion_tags, created_at')
      .eq('project_id', project_id)
      .is('chapter_id', null)
      .eq('is_draft', false)
      .order('created_at', { ascending: true })
      .limit(10)

    if (!unassigned || unassigned.length < 10) {
      return new Response(JSON.stringify({ error: 'Not enough records', count: unassigned?.length ?? 0 }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const recordIds = unassigned.map((r) => r.id)
    const recordsText = unassigned
      .map((r, i) => `[${i + 1}] (${(r.emotion_tags ?? []).join(', ')}) ${r.content}`)
      .join('\n')

    let chapterTitle = `챕터 ${(chapterCount ?? 0) + 1}`
    let chapterContent = unassigned.map((r) => r.content).join('\n\n')

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (anthropicKey) {
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
          messages: [{
            role: 'user',
            content: `프로젝트: ${project.title} (${project.type})\n챕터 번호: ${(chapterCount ?? 0) + 1}\n\n기록:\n${recordsText}`,
          }],
        }),
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        const text = aiData?.content?.[0]?.text?.trim() ?? ''
        try {
          const parsed = JSON.parse(text)
          chapterTitle = parsed.chapter_title ?? chapterTitle
          chapterContent = parsed.chapter_content ?? chapterContent
        } catch {
          chapterContent = text || chapterContent
        }
      }
    }

    const chapterNumber = (chapterCount ?? 0) + 1

    const { data: chapter, error: insertError } = await admin
      .from('chapters')
      .insert({
        project_id,
        user_id: user.id,
        chapter_number: chapterNumber,
        title: chapterTitle,
        ai_content: chapterContent,
        record_ids: recordIds,
        is_complete: true,
        sort_order: chapterNumber,
      })
      .select()
      .single()

    if (insertError) throw insertError

    await admin
      .from('records')
      .update({ chapter_id: chapter.id })
      .in('id', recordIds)

    await admin.from('notifications').insert({
      user_id: user.id,
      type: 'chapter_complete',
      title: `챕터 ${chapterNumber} 초안이 완성됐어요`,
      body: 'AI가 10개의 기록으로 챕터를 구성했어요',
      link: `/book/chapter/${chapter.id}`,
    })

    await admin.from('ai_usage').insert({
      user_id: user.id,
      feature: 'chapter',
      project_id,
    })

    return new Response(JSON.stringify({
      chapter_id: chapter.id,
      chapter_number: chapterNumber,
      chapter_title: chapterTitle,
      chapter_content: chapterContent,
    }), {
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
