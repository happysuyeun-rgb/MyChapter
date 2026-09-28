import { isDevBypass } from '@/lib/devBypass'
import { mockGenerateQuestion } from '@/mocks'
import { supabase } from '@/lib/supabase'
import type { ProjectType } from '@/types/database'

export class ApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

const FALLBACK_QUESTIONS: Record<ProjectType, string> = {
  emotion: '오늘 하루 중 가장 선명하게 남는 감정의 순간은 언제인가요?',
  parenting: '오늘 아이와 함께한 순간 중 가장 기억에 남는 장면은 무엇인가요?',
  yearly: '올해의 나에게 고마웠던 작은 순간은 무엇인가요?',
  career: '오늘 새로운 도전을 향해 내딛은 한 걸음이 있었나요?',
  custom: '오늘 하루를 돌아보며 가장 먼저 떠오르는 생각은 무엇인가요?',
  growth: '요즘의 나를 이전과 조금 다르게 만든 순간이 있었나요?',
  life_story: '지금 떠올리면 여전히 선명한 오래된 장면은 무엇인가요?',
  relationships: '오늘 누군가의 말이나 행동이 마음에 남았다면 무엇인가요?',
  travel: '오늘 여행에서 가장 오래 기억하고 싶은 장면은 무엇인가요?',
  hobby: '오늘 좋아하는 일을 하며 발견한 작은 즐거움은 무엇인가요?',
  learning: '오늘 배우거나 시도하며 새롭게 알게 된 것은 무엇인가요?',
}

export function getFallbackQuestion(projectType: ProjectType): string {
  return FALLBACK_QUESTIONS[projectType] ?? FALLBACK_QUESTIONS.custom
}

export async function generateQuestion(projectId: string): Promise<string> {
  if (isDevBypass()) return mockGenerateQuestion()

  const { data: session } = await supabase.auth.getSession()
  if (!session.session) throw new Error('로그인이 필요합니다.')

  const response = await supabase.functions.invoke('generate-question', {
    body: { project_id: projectId },
  })

  const body = response.data as { question?: string; code?: string; error?: string } | null

  if (body?.code === 'AI_LIMIT') {
    throw new ApiError('AI_LIMIT', '이번 달 AI 질문 한도에 도달했어요.')
  }

  if (body?.question) return body.question

  if (response.error) {
    const { data: project } = await supabase
      .from('projects')
      .select('type')
      .eq('id', projectId)
      .maybeSingle()

    if (project?.type) {
      return getFallbackQuestion(project.type)
    }
  }

  return FALLBACK_QUESTIONS.emotion
}

