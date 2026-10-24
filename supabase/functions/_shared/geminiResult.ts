/** Pure Gemini result types + chapter manuscript guard (no Deno / network). */

export type GeminiFailureReason = 'missing_key' | 'upstream_error' | 'empty_response'

export type GeminiTextResult =
  | { ok: true; text: string }
  | { ok: false; reason: GeminiFailureReason }

export type ChapterAiAttempt =
  | { status: 'ok'; title: string; content: string }
  | {
      status: 'unavailable'
      reason: GeminiFailureReason | 'invalid_payload'
    }

export const AI_UNAVAILABLE_CODE = 'AI_UNAVAILABLE'

export const AI_UNAVAILABLE_MESSAGE =
  'AI 원고를 만들지 못했어요. 잠시 후 다시 시도해주세요.'

/**
 * Require a usable AI manuscript. Never falls back to concatenating source records.
 */
export function buildChapterFromAiText(
  ai: GeminiTextResult,
  parseJson: (text: string) => { chapter_title?: string; chapter_content?: string } | null,
  fallbackTitle: string,
): ChapterAiAttempt {
  if (!ai.ok) {
    return { status: 'unavailable', reason: ai.reason }
  }

  const trimmed = ai.text.trim()
  if (!trimmed) {
    return { status: 'unavailable', reason: 'empty_response' }
  }

  const parsed = parseJson(trimmed)
  const content = (parsed?.chapter_content ?? trimmed).trim()
  if (!content) {
    return { status: 'unavailable', reason: 'invalid_payload' }
  }

  const title = (parsed?.chapter_title ?? fallbackTitle).trim() || fallbackTitle
  return { status: 'ok', title, content }
}

export function aiUnavailableResponseBody(
  reason: GeminiFailureReason | 'invalid_payload',
) {
  return {
    code: AI_UNAVAILABLE_CODE,
    error: AI_UNAVAILABLE_MESSAGE,
    reason,
  }
}
