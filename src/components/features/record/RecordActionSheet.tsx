import { BottomSheet } from '@/components/common'

interface RecordActionSheetProps {
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function RecordActionSheet({
  open,
  onClose,
  onEdit,
  onDelete,
}: RecordActionSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <button
        type="button"
        className="flex w-full items-center gap-3 px-6 py-3.5 text-left"
        onClick={() => {
          onClose()
          onEdit()
        }}
      >
        <span className="text-xl">✏️</span>
        <span className="text-[15px] font-medium">기록 수정하기</span>
      </button>
      <div className="mx-6 h-px bg-border" />
      <button
        type="button"
        className="flex w-full items-center gap-3 px-6 py-3.5 text-left"
        onClick={() => {
          onClose()
          onDelete()
        }}
      >
        <span className="text-xl">🗑</span>
        <span className="text-[15px] font-medium text-danger">기록 삭제</span>
      </button>
    </BottomSheet>
  )
}
