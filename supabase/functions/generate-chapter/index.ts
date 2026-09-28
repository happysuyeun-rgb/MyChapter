import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { generateGeminiText, parseJsonResponse } from '../_shared/gemini.ts'

const MIN_RECORDS_FOR_CHAPTER = 3
const MAX_CLUSTER_RECORDS = 12

const CLUSTER_PROMPT = `당신은 MY CHAPTER의 책 구조 편집자입니다.
아직 챕터에 배치되지 않은 기록들 중 서로 의미적으로 연결되는 기록을 골라 "다음 한 챕터"의 재료를 구성하세요.

원칙:
- 날짜순으로 앞에서부터 일정 개수를 자르지 않습니다.
- 반복되는 주제, 인물, 감정, 사건, 갈등, 변화의 흐름을 우선합니다.
- 서로 관련이 약한 기록을 억지로 묶지 않습니다.
- 기록에 없는 사실을 추론하지 않습니다.
- 가능한 한 5~12개의 기록을 고릅니다.
- 남은 기록이 12개 이하라면 모두 한 챕터 후보로 사용할 수 있습니다.
- 선택 후 1~2개만 애매하게 남기지 않도록 합니다.
- record_id는 입력에 있는 값만 그대로 반환합니다.

JSON만 반환:
{"selected_record_ids":["uuid"],"reason":"선택 이유 1문장"}`

const SYSTEM_PROMPT = `당신은 MY CHAPTER의 전문 에세이 편집자입니다.
선택된 사용자의 기록을 단순 요약하거나 이어 붙이지 말고, 한 챕터로 읽히는 서사적 원고로 재구성하세요.

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
- 기록 수와 내용 밀도에 맞춰 약 1,000~2,000자 사이를 목표로 하되 내용이 부족하면 억지로 늘리지 않습니다.

출력 규칙:
- JSON 형식으로만 응답합니다.
- 형식: {"chapter_title":"10~24자 이내의 구체적인 제목","chapter_content":"본문\\n\\n단락구분"}
- chapter_content는 마크다운 없이 순수 텍스트이며 단락은 \\n\\n으로 구분합니다.
- 제목은 '성장', '변화', '나의 이야기' 같은 추상적인 단어만으로 만들지 말고 이 챕터의 실제 장면이나 중심 의미가 느껴지게 작성합니다.`

type SourceRecord = {
  id: string
  title: string | null
  question_text: string | null
  content: string
  emotion_tags: string[] | null
  created_at: string
}

function fallbackCluster(records: SourceRecord[]): SourceRecord[] {
  if (records.length <= MAX_CLUSTER_RECORDS) return records

  const size = Math.min(MAX_CLUSTER_RECORDS, Math.max(5, Math.ceil(records.length / Math.ceil(records.length / 9))))
  const selected = records.slice(0, size)
  const remaining = records.length - selected.length

  if (remaining > 0 && remaining < MIN_RECORDS_FOR_CHAPTER) {
    return records.slice(0, selected.length + remaining)
  }

  return selected
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

    const { data: unassigned, error: recordsError } = await admin
      .from('records')
      .select('id, title, question_text, content, emotion_tags, created_at')
      .eq('project_id', project_id)
      .is('chapter_id', null)
      .eq('is_draft', false)
      .order('created_at', { ascending: true })

    if (recordsError) throw recordsError

    const records = (unassigned ?? []) as SourceRecord[]
    if (records.length < MIN_RECORDS_FOR_CHAPTER) {
      return new Response(JSON.stringify({
        code: 'NOT_ENOUGH_MATERIAL',
        error: '챕터를 만들기 위한 기록이 조금 더 필요해요.',
        count: records.length,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: analyses } = await admin
      .from('record_analysis')
      .select('record_id, summary, themes, people, places, emotions, events, change, insight')
      .in('record_id', records.map((record) => record.id))

    const analysisMap = new Map((analyses ?? []).map((item) => [item.record_id, item]))

    let selectedRecords = fallbackCluster(records)

    if (records.length > MAX_CLUSTER_RECORDS) {
      const overview = records.map((record, index) => {
        const analysis = analysisMap.get(record.id)
        const context = analysis
          ? JSON.stringify({
              summary: analysis.summary,
              themes: analysis.themes,
              people: analysis.people,
              places: analysis.places,
              emotions: analysis.emotions,
              events: analysis.events,
              change: analysis.change,
              insight: analysis.insight,
            })
          : record.content.slice(0, 500)

        return [
          `[${index + 1}] record_id=${record.id}`,
          `date=${record.created_at.slice(0, 10)}`,
          `emotion=${(record.emotion_tags ?? []).join(', ') || '없음'}`,
          `context=${context}`,
        ].join(' | ')
      }).join('\n')

      const clusterText = await generateGeminiText({
        systemInstruction: CLUSTER_PROMPT,
        prompt: `프로젝트 제목: ${project.title}\n프로젝트 유형: ${project.type}\n미배치 기록 수: ${records.length}\n\n기록 목록:\n${overview}`,
        maxOutputTokens: 1024,
        json: true,
      })

      const parsed = clusterText
        ? parseJsonResponse<{ selected_record_ids?: string[]; reason?: string }>(clusterText)
        : null

      if (parsed?.selected_record_ids?.length) {
        const recordMap = new Map(records.map((record) => [record.id, record]))
        const uniqueIds = [...new Set(parsed.selected_record_ids)]
        const candidate = uniqueIds
          .map((id) => recordMap.get(id))
          .filter((record): record is SourceRecord => Boolean(record))

        if (candidate.length >= MIN_RECORDS_FOR_CHAPTER) {
          selectedRecords = candidate.slice(0, MAX_CLUSTER_RECORDS)

          const remaining = records.length - selectedRecords.length
          if (remaining > 0 && remaining < MIN_RECORDS_FOR_CHAPTER) {
            const selectedIds = new Set(selectedRecords.map((record) => record.id))
            selectedRecords = [
              ...selectedRecords,
              ...records.filter((record) => !selectedIds.has(record.id)),
            ]
          }
        }
      }
    }

    const recordIds = selectedRecords.map((record) => record.id)
    const recordsText = selectedRecords
      .map((record, index) => {
        const heading = record.title || record.question_text || `기록 ${index + 1}`
        return `[${index + 1}] ${record.created_at.slice(0, 10)} · ${heading}\n감정: ${(record.emotion_tags ?? []).join(', ') || '없음'}\n${record.content}`
      })
      .join('\n\n---\n\n')

    let chapterTitle = `챕터 ${(chapterCount ?? 0) + 1}`
    let chapterContent = selectedRecords.map((record) => record.content).join('\n\n')

    const aiText = await generateGeminiText({
      systemInstruction: SYSTEM_PROMPT,
      prompt: `프로젝트 제목: ${project.title}\n프로젝트 유형: ${project.type}\n챕터 번호: ${(chapterCount ?? 0) + 1}\n선택된 기록 수: ${selectedRecords.length}\n\n아래 기록만을 사실의 근거로 사용해 한 챕터의 원고를 작성하세요. 기록에 없는 내용을 추측해 채우지 마세요.\n\n원본 기록:\n${recordsText}`,
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

    const { error: relationError } = await admin
      .from('chapter_records')
      .insert(recordIds.map((recordId, index) => ({
        chapter_id: chapter.id,
        record_id: recordId,
        position: index + 1,
      })))

    if (relationError) {
      await admin.from('chapters').delete().eq('id', chapter.id)
      throw relationError
    }

    await admin
      .from('records')
      .update({ chapter_id: chapter.id })
      .in('id', recordIds)

    await admin.from('notifications').insert({
      user_id: user.id,
      type: 'chapter_complete',
      title: `챕터 ${chapterNumber} 초안이 완성됐어요`,
      body: `PAGE가 ${recordIds.length}개의 관련 기록을 한 챕터로 엮었어요`,
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
      source_record_count: recordIds.length,
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
