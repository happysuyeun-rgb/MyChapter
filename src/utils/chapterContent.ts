import type { Chapter } from '@/types/database'

export function getChapterDisplayContent(chapter: Chapter): string {
  return chapter.user_content ?? chapter.ai_content ?? ''
}

export function estimateChapterPages(recordCount: number): number {
  return Math.max(1, Math.ceil(recordCount * 1.2))
}
