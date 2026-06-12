import { supabase } from '@/lib/supabase'
import type { ProjectType } from '@/types/database'

const FALLBACK_HINTS: Record<ProjectType, string> = {
  emotion: '오늘 하루 중 예상과 달랐던 순간을 떠올려보세요.',
  parenting: '오늘 아이와 나눈 작은 대화가 떠오르나요?',
  yearly: '올해 초의 나와 지금의 나, 무엇이 달라졌나요?',
  career: '오늘 나를 가장 긴장하게 한 순간은 무엇이었나요?',
  custom: '오늘 하루를 한 문장으로 표현한다면?',
}

export async function generateFreewritingHint(projectId: string): Promise<string> {
  const response = await supabase.functions.invoke('generate-freewriting-hint', {
    body: { project_id: projectId },
  })

  const body = response.data as { hint?: string } | null
  if (body?.hint) return body.hint

  const { data: project } = await supabase
    .from('projects')
    .select('type')
    .eq('id', projectId)
    .maybeSingle()

  if (project?.type) return FALLBACK_HINTS[project.type]
  return FALLBACK_HINTS.emotion
}
