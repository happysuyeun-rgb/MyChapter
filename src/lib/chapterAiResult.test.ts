import { describe, expect, it } from 'vitest'
import {
  AI_UNAVAILABLE_CODE,
  aiUnavailableResponseBody,
  buildChapterFromAiText,
  type GeminiTextResult,
} from '../../supabase/functions/_shared/geminiResult.ts'

function parse(text: string) {
  try {
    return JSON.parse(text) as { chapter_title?: string; chapter_content?: string }
  } catch {
    return null
  }
}

/** Mirrors Edge: only ok manuscripts may INSERT/UPDATE. */
function mayPersistChapter(ai: GeminiTextResult): boolean {
  return buildChapterFromAiText(ai, parse, '챕터 1').status === 'ok'
}

describe('buildChapterFromAiText (S-02)', () => {
  it('missing_key → unavailable, no persist', () => {
    const result = buildChapterFromAiText({ ok: false, reason: 'missing_key' }, parse, '챕터 1')
    expect(result).toEqual({ status: 'unavailable', reason: 'missing_key' })
    expect(mayPersistChapter({ ok: false, reason: 'missing_key' })).toBe(false)
    expect(aiUnavailableResponseBody('missing_key').code).toBe(AI_UNAVAILABLE_CODE)
  })

  it('upstream_error → unavailable, no persist', () => {
    const result = buildChapterFromAiText({ ok: false, reason: 'upstream_error' }, parse, '챕터 1')
    expect(result.status).toBe('unavailable')
    if (result.status === 'unavailable') expect(result.reason).toBe('upstream_error')
    expect(mayPersistChapter({ ok: false, reason: 'upstream_error' })).toBe(false)
  })

  it('empty_response → unavailable, no persist', () => {
    expect(mayPersistChapter({ ok: false, reason: 'empty_response' })).toBe(false)
    expect(mayPersistChapter({ ok: true, text: '   ' })).toBe(false)
  })

  it('invalid JSON without usable body → unavailable', () => {
    const result = buildChapterFromAiText(
      { ok: true, text: '{"chapter_title":"T","chapter_content":""}' },
      parse,
      '챕터 1',
    )
    expect(result).toEqual({ status: 'unavailable', reason: 'invalid_payload' })
  })

  it('regenerate failure path preserves prior content (no persist)', () => {
    const prior = { title: '기존 제목', ai_content: '기존 원고' }
    const failed = buildChapterFromAiText({ ok: false, reason: 'upstream_error' }, parse, prior.title)
    expect(failed.status).toBe('unavailable')
    // Caller must skip UPDATE — prior object unchanged.
    expect(prior).toEqual({ title: '기존 제목', ai_content: '기존 원고' })
  })

  it('normal JSON → ok manuscript for insert', () => {
    const result = buildChapterFromAiText(
      {
        ok: true,
        text: JSON.stringify({
          chapter_title: '빗소리',
          chapter_content: '창가에 앉아 있었다.\n\n마음이 조금 가라앉았다.',
        }),
      },
      parse,
      '챕터 1',
    )
    expect(result).toEqual({
      status: 'ok',
      title: '빗소리',
      content: '창가에 앉아 있었다.\n\n마음이 조금 가라앉았다.',
    })
    expect(mayPersistChapter({
      ok: true,
      text: JSON.stringify({ chapter_title: '빗소리', chapter_content: '본문' }),
    })).toBe(true)
  })

  it('non-JSON prose still usable as content', () => {
    const result = buildChapterFromAiText(
      { ok: true, text: '단락만 있는 원고입니다.' },
      parse,
      '챕터 1',
    )
    expect(result).toEqual({
      status: 'ok',
      title: '챕터 1',
      content: '단락만 있는 원고입니다.',
    })
  })
})
