import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { generateGeminiText, parseJsonResponse } from '../_shared/gemini.ts'

const SYSTEM_PROMPT = `당신은 MY CHAPTER의 전문 에세이 편집자입니다.
여러 날짜에 걸쳐 쌓인 사용자의 기록을 단순 요약하거나 이어 붙이지 말고, 한 챕터로 읽히는 서사적 원고로 재구성하세요.

편집 원칙:
- 기록에 없는 사건, 대화, 감정, 인물, 장소, 원인과 결과를 새로 만들어내지 않습니다.
- 사용자가 실제로 쓴 표현, 구체적인 장면, 감정의 결을 우선적으로 살립니다.
- 여러 기록에서 반복되는 주제와 변화의 흐름을 찾아 하나의 중심 주제로 묶습니다.
- 날짜순 나열보다 '장면 → 감정/갈등 → 변화 또는 깨달음'의 흐름을 우선하되, 실제 기록의 시간관계는 왜곡하지 않습니다.
- 모든 기록을 억지로 한 번씩 언급할 필요는 없지만 핵심 의미가 빠지지 않게 합니다.
- 자기계발식 교훈, 과장된 감동, 상투적인 결론을 임의로 덧붙이지 않습니다.
- 사용자의 1인칭 목소리처럼 자연스럽게 씁니다. 일기 요약문이나 AI 보고서처럼 쓰지 않습니다.
- 기본 문체는 담백한 한국어 에세이체입니다. 사용자의 원문 말투가 뚜렷하면 그 리듬을 우선합니다.
- 프로젝트 유형은 주제 선택의 힌트일 뿐, 기록에 없는 방향으로 내용을 끌고 가지 않습니다.
- 첫 문단은 설명보다 구체적인 장면이나 생각으로 시작하는 것을 우선합니다.
- 마지막 문단은 기록에서 실제로 드러난 변화, 질문, 여운으로 마무리합니다.
- 기록 10개 기준 약 1,200~1,800자 분량을 목표로 하되 내용이 부족하면 억지로 늘리지 않습니다.

출력 규칙:
- JSON 형식으로만 응답합니다.
- 형식: {"chapter_title":"10~24자 이내의 구체적인 제목","chapter_content":"본문\\n\\n단락구분"}
- chapter_content는 마크다운 없이 순수 텍스트이며 단락은 \\n\\n으로 구분합니다.
- 제목은 '성장', '변화', '나의 이야기' 같은 추상적인 단어만으로 만들지 말고 이 챕터의 실제 장면이나 중심 의미가 느껴지게 작성합니다.`

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

    const aiText = await generateGeminiText({
      systemInstruction: SYSTEM_PROMPT,
      prompt: `프로젝트 제목: ${project.title}\n프로젝트 유형: ${project.type}\n챕터 번호: ${(chapterCount ?? 0) + 1}\n\n아래 기록만을 사실의 근거로 사용해 한 챕터의 원고를 작성하세요. 기록에 없는 내용을 추측해 채우지 마세요.\n\n원본 기록:\n${recordsText}`,
      maxOutputTokens: 4096,
      json: true,
    })

    if (aiText) {
      const parsed = parseJsonResponse<{ chapter_title?: string; chapter_content?: string }>(aiText)
      if (parsed) {
        chapterTitle = parsed.chapter_title ?? chapterTitle
        chapterContent = parsed.chapter_content ?? chapterContent
      } else {
        chapterContent = aiText || chapterContent
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
