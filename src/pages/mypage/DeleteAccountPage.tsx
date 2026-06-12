import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Modal } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { deleteAccount } from '@/lib/api/account'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

export function DeleteAccountPage() {
  const navigate = useNavigate()
  const { signOut } = useAuthStore()
  const { reset: resetSubscription } = useSubscriptionStore()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const canDelete = confirmText === '계정 삭제'

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteAccount()
      resetSubscription()
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      setError('계정 삭제에 실패했어요. 다시 시도해주세요.')
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar title="계정 삭제" leftLabel="‹ 뒤로" />
      <div className="flex-1 p-5 pt-7">
        <div className="mb-4 text-[32px]">⚠️</div>
        <h1 className="mb-3 text-lg font-bold">정말 떠나시려고 하나요?</h1>
        <p className="mb-7 text-sm leading-relaxed text-ink-muted">
          계정을 삭제하면 아래 데이터가 모두 삭제되며 복구할 수 없어요.
        </p>
        <Card className="mb-7 p-4 text-sm">
          <p className="py-2">📝 모든 기록 <strong className="text-danger">영구 삭제</strong></p>
          <p className="py-2">📖 완성한 책 <strong className="text-danger">영구 삭제</strong></p>
          <p className="py-2">💳 구독 자동 해지</p>
        </Card>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          계정 삭제
        </Button>
        <Button variant="ghost" className="mt-3" onClick={() => navigate(-1)}>
          취소
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="계정 삭제 확인">
        <p className="mb-4 text-center text-sm leading-relaxed text-ink-muted">
          정말 삭제하시려면 아래에
          <br />
          <strong className="text-ink">계정 삭제</strong>를 입력해주세요.
        </p>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="계정 삭제"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <Button
          variant="danger"
          className="mt-4"
          disabled={!canDelete || deleting}
          onClick={() => void handleDelete()}
        >
          {deleting ? '삭제 중...' : '영구 삭제'}
        </Button>
        <Button variant="ghost" className="mt-2" onClick={() => setConfirmOpen(false)}>
          취소
        </Button>
      </Modal>
    </div>
  )
}
