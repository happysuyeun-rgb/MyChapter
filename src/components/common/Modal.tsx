import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-ink/50" aria-label="닫기" onClick={onClose} />
      <div className="relative z-10 w-full max-w-phone border-t border-ink bg-surface p-6 sm:border">
        {title && (
          <div className="mb-5 border-b border-border pb-4">
            <p className="text-[9px] font-semibold tracking-[0.16em] text-sage">DIALOG</p>
            <h2 className="mt-2 font-serif text-xl font-bold">{title}</h2>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
