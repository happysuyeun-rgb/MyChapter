import type { ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" className="absolute inset-0 bg-ink/45" aria-label="닫기" onClick={onClose} />
      <div className="relative z-10 w-full max-w-phone border-t border-ink bg-surface pb-4 pt-3">
        <div className="mx-auto mb-3 h-px w-10 bg-ink/35" />
        {children}
      </div>
    </div>
  )
}
