import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.24.0'
import type { GeminiTextResult } from './geminiResult.ts'

export const GEMINI_MODEL = 'gemini-2.5-flash'

export function getGeminiApiKey(): string | undefined {
  return Deno.env.get('GOOGLE_AI_API_KEY')
}

/**
 * Structured Gemini call. Distinguishes missing key, upstream errors, and empty text.
 */
export async function tryGenerateGeminiText(options: {
  systemInstruction?: string
  prompt: string
  maxOutputTokens?: number
  json?: boolean
}): Promise<GeminiTextResult> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return { ok: false, reason: 'missing_key' }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: options.systemInstruction,
      generationConfig: {
        maxOutputTokens: options.maxOutputTokens ?? 256,
        ...(options.json ? { responseMimeType: 'application/json' } : {}),
      },
    })

    const result = await model.generateContent(options.prompt)
    const text = result.response.text()?.trim()
    if (!text) {
      return { ok: false, reason: 'empty_response' }
    }
    return { ok: true, text }
  } catch {
    return { ok: false, reason: 'upstream_error' }
  }
}

/** Soft API for callers that already handle null (question/hint/pdf tagline). */
export async function generateGeminiText(options: {
  systemInstruction?: string
  prompt: string
  maxOutputTokens?: number
  json?: boolean
}): Promise<string | null> {
  const result = await tryGenerateGeminiText(options)
  return result.ok ? result.text : null
}

export function stripQuotes(text: string): string {
  return text.replace(/^["']|["']$/g, '')
}

export function parseJsonResponse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) {
      try {
        return JSON.parse(match[1].trim()) as T
      } catch {
        return null
      }
    }
    return null
  }
}
