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
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-phone rounded-t-[20px] bg-white pb-2 pt-5">
        <div className="mx-auto mb-5 h-1 w-9 rounded-sm bg-border-strong" />
        {children}
      </div>
    </div>
  )
}
