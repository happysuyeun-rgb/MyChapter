import { BottomSheet } from '@/components/common'

interface RecordActionSheetProps {
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function RecordActionSheet({ open, onClose, onEdit, onDelete }: RecordActionSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <button
        type="button"
        className="flex min-h-[56px] w-full items-center justify-between border-b border-border px-6 text-left"
        onClick={() => {
          onClose()
          onEdit()
        }}
      >
        <span className="text-sm font-semibold">기록 수정하기</span>
        <span className="text-ink-faint">→</span>
      </button>
      <button
        type="button"
        className="flex min-h-[56px] w-full items-center justify-between px-6 text-left"
        onClick={() => {
          onClose()
          onDelete()
        }}
      >
        <span className="text-sm font-semibold text-danger">기록 삭제</span>
        <span className="text-danger">→</span>
      </button>
    </BottomSheet>
  )
}
