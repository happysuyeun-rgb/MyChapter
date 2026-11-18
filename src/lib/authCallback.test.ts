import { describe, expect, it } from 'vitest'
import { formatAuthRedirectError, parseAuthRedirectError } from './authCallback'

describe('formatAuthRedirectError', () => {
  it('maps cancel codes to a fixed Korean message', () => {
    expect(formatAuthRedirectError('access_denied', 'User cancelled')).toBe(
      '로그인이 취소됐어요. 다시 시도해주세요.',
    )
  })

  it('maps expired codes', () => {
    expect(formatAuthRedirectError('otp_expired')).toBe(
      '로그인 링크가 만료됐어요. 이메일을 다시 받아주세요.',
    )
  })

  it('never echoes raw error_description', () => {
    const message = formatAuthRedirectError('server_error', 'Something blew up with PII')
    expect(message).toBe('로그인하지 못했어요. 다시 시도해주세요.')
    expect(message).not.toContain('PII')
  })
})

describe('parseAuthRedirectError', () => {
  it('reads query params', () => {
    expect(
      parseAuthRedirectError('https://my-chapter.vercel.app/splash?error=access_denied&error_description=Nope'),
    ).toBe('로그인이 취소됐어요. 다시 시도해주세요.')
  })

  it('reads hash params', () => {
    expect(
      parseAuthRedirectError('https://my-chapter.vercel.app/splash#error=otp_expired&error_description=old'),
    ).toBe('로그인 링크가 만료됐어요. 이메일을 다시 받아주세요.')
  })

  it('returns null when no error param', () => {
    expect(parseAuthRedirectError('https://my-chapter.vercel.app/splash')).toBeNull()
  })
})
