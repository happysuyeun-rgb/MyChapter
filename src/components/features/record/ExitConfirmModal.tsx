import { Button, Modal } from '@/components/common'

interface ExitConfirmModalProps {
  open: boolean
  onSaveDraft: () => void
  onDiscard: () => void
  onContinue: () => void
}

export function ExitConfirmModal({
  open,
  onSaveDraft,
  onDiscard,
  onContinue,
}: ExitConfirmModalProps) {
  return (
    <Modal open={open} onClose={onContinue} title="작성 중인 내용이 있어요">
      <p className="mb-5 text-center text-sm text-ink-muted">
        나가기 전에 어떻게 할까요?
      </p>
      <Button onClick={onSaveDraft}>임시저장 후 나가기</Button>
      <Button variant="secondary" className="mt-2" onClick={onDiscard}>
        삭제 후 나가기
      </Button>
      <Button variant="ghost" className="mt-2" onClick={onContinue}>
        계속 작성
      </Button>
    </Modal>
  )
}
