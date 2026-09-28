import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { generateGeminiText, parseJsonResponse } from '../_shared/gemini.ts'

const SYSTEM_PROMPT = `당신은 MY CHAPTER의 전문 에세이 편집자입니다.
사용자의 원본 기록을 바탕으로 기존 챕터를 새 원고로 다시 편집하세요.

규칙:
- 원본 기록에 없는 사실, 대화, 감정, 인물, 장소를 만들어내지 않습니다.
- 기록을 단순 요약하거나 날짜별로 나열하지 않습니다.
- 반복되는 주제와 감정의 변화를 찾아 하나의 중심 서사로 묶습니다.
- '장면 → 감정/갈등 → 변화 또는 여운'의 흐름을 우선합니다.
- 사용자의 표현과 목소리를 최대한 보존하고, AI 특유의 상투적 문장과 과장된 교훈을 피합니다.
- 기본은 담백한 1인칭 한국어 에세이체입니다.
- 첫 문단은 구체적인 장면이나 생각에서 시작하고, 마지막은 기록에서 실제로 드러난 변화나 질문으로 마무리합니다.
- 약 1,200~1,800자를 목표로 하되 기록이 부족하면 내용을 창작해 늘리지 않습니다.
- JSON만 응답합니다: {"chapter_title":"10~24자 이내 제목","chapter_content":"본문\\n\\n단락구분"}`

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

    const { data: relations, error: relationError } = await admin
      .from('chapter_records')
      .select('record_id, position')
      .eq('chapter_id', chapter_id)
      .order('position', { ascending: true })

    if (relationError) throw relationError

    const recordIds = (relations ?? []).map((relation) => relation.record_id)
    const { data: sourceRecords, error: recordsError } = recordIds.length
      ? await admin
          .from('records')
          .select('id, content, emotion_tags, created_at')
          .in('id', recordIds)
      : { data: [], error: null }

    if (recordsError) throw recordsError

    const recordMap = new Map((sourceRecords ?? []).map((record) => [record.id, record]))
    const records = recordIds.flatMap((recordId) => {
      const record = recordMap.get(recordId)
      return record ? [record] : []
    })

    const recordsText = records
      .map((r, i) => `[${i + 1}] (${r.created_at}) [${(r.emotion_tags ?? []).join(', ')}] ${r.content}`)
      .join('\n')

    let title = chapter.title
    let content = chapter.ai_content ?? ''

    if (recordsText) {
      const aiText = await generateGeminiText({
        systemInstruction: SYSTEM_PROMPT,
        prompt: `기존 챕터 제목: ${chapter.title}\n\n아래 원본 기록만을 근거로 챕터를 다시 작성하세요. 기존 원고의 문장을 답습하기보다 기록 자체에서 더 자연스러운 흐름을 찾으세요.\n\n원본 기록:\n${recordsText}`,
        maxOutputTokens: 4096,
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
