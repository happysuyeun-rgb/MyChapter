import { ApiError } from '@/lib/api/questions'
import { supabase } from '@/lib/supabase'
import type { ProjectType } from '@/types/database'

const FALLBACK_HINTS: Record<ProjectType, string> = {
  emotion: '오늘 하루 중 예상과 달랐던 순간을 떠올려보세요.',
  parenting: '오늘 아이와 나눈 작은 대화가 떠오르나요?',
  yearly: '올해 초의 나와 지금의 나, 무엇이 달라졌나요?',
  career: '오늘 나를 가장 긴장하게 한 순간은 무엇이었나요?',
  growth: '요즘의 나에게서 가장 달라졌다고 느끼는 점은 무엇인가요?',
  life_story: '지금의 나를 만든 기억 하나를 떠올려보세요.',
  relationships: '오늘 마음에 오래 남은 사람과의 순간이 있었나요?',
  travel: '오늘 만난 풍경이나 장면 중 오래 기억하고 싶은 것은 무엇인가요?',
  hobby: '오늘 내가 좋아하는 일에 몰입했던 순간은 언제였나요?',
  learning: '오늘 새롭게 알게 되었거나 생각이 바뀐 것은 무엇인가요?',
  custom: '오늘 하루를 한 문장으로 표현한다면?',
}

export function getFallbackHint(projectType: ProjectType): string {
  return FALLBACK_HINTS[projectType]
}

export async function generateFreewritingHint(projectId: string): Promise<string> {
  const response = await supabase.functions.invoke('generate-freewriting-hint', {
    body: { project_id: projectId },
  })

  const body = response.data as { hint?: string; code?: string } | null

  if (body?.code === 'AI_LIMIT') {
    throw new ApiError('AI_LIMIT', '이번 달 AI 글감 한도에 도달했어요.')
  }

  if (body?.hint) return body.hint

  const { data: project } = await supabase
    .from('projects')
    .select('type')
    .eq('id', projectId)
    .maybeSingle()

  if (project?.type) return FALLBACK_HINTS[project.type]
  return FALLBACK_HINTS.emotion
}
