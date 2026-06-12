import type { ReactNode } from 'react'

interface PageShellProps {
  screenId: string
  title: string
  children?: ReactNode
}

export function PageShell({ screenId, title, children }: PageShellProps) {
  return (
    <div className="flex flex-1 flex-col p-5">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-accent">
        {screenId}
      </p>
      <h1 className="mb-4 text-xl font-bold">{title}</h1>
      {children ?? (
        <p className="text-sm text-ink-muted">구현 예정</p>
      )}
    </div>
  )
}
