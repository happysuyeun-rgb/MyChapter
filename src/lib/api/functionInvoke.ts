import { FunctionsHttpError } from '@supabase/supabase-js'

export type FunctionErrorBody = { code?: string; error?: string; [key: string]: unknown }

export async function readFunctionErrorBody(error: unknown): Promise<FunctionErrorBody | null> {
  if (!(error instanceof FunctionsHttpError)) return null
  const context = error.context as Response | undefined
  if (!context || typeof context.json !== 'function') return null
  try {
    const cloned = typeof context.clone === 'function' ? context.clone() : context
    const body = await cloned.json()
    return body && typeof body === 'object' ? (body as FunctionErrorBody) : null
  } catch {
    return null
  }
}

export async function resolveFunctionPayload<T extends Record<string, unknown>>(
  response: { data: T | null; error: Error | null },
): Promise<{ data: T | null; errorBody: FunctionErrorBody | null; error: Error | null }> {
  if (response.data) return { data: response.data, errorBody: null, error: response.error }
  const errorBody = await readFunctionErrorBody(response.error)
  return { data: null, errorBody, error: response.error }
}
