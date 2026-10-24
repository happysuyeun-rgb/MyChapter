import { Button, Modal } from '@/components/common'

interface SaveConflictModalProps {
  open: boolean
  onOpenExisting: () => void
  onSaveAsNew: () => void
  onContinue: () => void
}

export function SaveConflictModal({
  open,
  onOpenExisting,
  onSaveAsNew,
  onContinue,
}: SaveConflictModalProps) {
  return (
    <Modal open={open} onClose={onContinue} title="이미 저장된 기록이 있어요">
      <p className="mb-5 text-sm leading-6 text-ink-muted">
        이전에 같은 작성 세션으로 저장된 기록이 있습니다. 지금 작성 중인 내용은 그대로 유지됩니다.
        어떻게 할까요?
      </p>
      <Button onClick={onOpenExisting}>기존 기록 열기</Button>
      <Button variant="secondary" className="mt-2" onClick={onSaveAsNew}>
        새 기록으로 저장
      </Button>
      <Button variant="ghost" className="mt-2" onClick={onContinue}>
        계속 작성
      </Button>
    </Modal>
  )
}
