import { isDevBypass } from '@/lib/devBypass'
import { mockGenerateQuestion, mockGetTodayQuestion } from '@/mocks'
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
}

export function getFallbackQuestion(projectType: ProjectType): string {
  return FALLBACK_QUESTIONS[projectType]
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

export async function getTodayQuestion(projectId: string): Promise<string | null> {
  if (isDevBypass()) return mockGetTodayQuestion()

  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('daily_questions')
    .select('question')
    .eq('project_id', projectId)
    .eq('question_date', today)
    .maybeSingle()

  return data?.question ?? null
}
