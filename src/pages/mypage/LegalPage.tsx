import { useEffect, useState } from 'react'
import { ErrorState, LoadingBlock } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'

interface LegalPageProps {
  title: string
  url: string
}

type LoadState = 'loading' | 'loaded' | 'failed'

/** iframe never fires onError for HTTP failures or frame blocking, so a timeout is the fallback signal. */
const LOAD_TIMEOUT_MS = 10_000

export function LegalPage({ title, url }: LegalPageProps) {
  const [state, setState] = useState<LoadState>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState('loading')

    const timer = window.setTimeout(() => {
      if (!cancelled) setState((prev) => (prev === 'loading' ? 'failed' : prev))
    }, LOAD_TIMEOUT_MS)

    const sameOrigin = new URL(url, window.location.href).origin === window.location.origin
    if (sameOrigin) {
      fetch(url, { cache: 'no-store' })
        .then((res) => {
          if (!cancelled && !res.ok) setState('failed')
        })
        .catch(() => {
          if (!cancelled) setState('failed')
        })
    }

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [url, attempt])

  const openExternally = () => {
    window.open(new URL(url, window.location.href).toString(), '_blank', 'noopener')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar title={title} leftLabel="←" />
      {state === 'failed' ? (
        <div className="flex flex-1 flex-col">
          <ErrorState
            title={`${title}을(를) 불러오지 못했어요`}
            description="네트워크 상태를 확인한 뒤 다시 시도해주세요."
            onRetry={() => setAttempt((n) => n + 1)}
          />
          <button
            type="button"
            className="mx-auto mb-10 min-h-11 text-xs font-semibold text-sage underline underline-offset-4"
            onClick={openExternally}
          >
            브라우저에서 열기
          </button>
        </div>
      ) : (
        <div className="relative flex-1">
          {state === 'loading' && (
            <div className="absolute inset-0 bg-surface">
              <LoadingBlock label="문서를 불러오는 중..." />
            </div>
          )}
          <iframe
            key={attempt}
            title={title}
            src={url}
            onLoad={() => setState((prev) => (prev === 'failed' ? prev : 'loaded'))}
            className="h-[calc(100dvh-56px)] w-full border-0 bg-surface"
          />
        </div>
      )}
    </div>
  )
}
