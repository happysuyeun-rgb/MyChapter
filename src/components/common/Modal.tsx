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
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-phone rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        {title && <h2 className="mb-4 text-center text-lg font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
