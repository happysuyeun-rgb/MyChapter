import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Modal } from '@/components/common'
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
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar title="계정 삭제" leftLabel="←" />
      <main className="flex-1 overflow-y-auto px-5 pb-10 pt-7">
        <header className="border-b border-danger pb-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-danger">PERMANENT DELETE</p>
          <h1 className="mt-3 font-serif text-[27px] font-bold leading-snug">계정을 삭제하면 이야기도 함께 사라져요.</h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">삭제 후에는 기록과 발행본을 복구할 수 없습니다.</p>
        </header>

        <section className="mt-7 border-y border-border">
          {[
            ['01', '모든 원본 기록과 사진', '영구 삭제'],
            ['02', '챕터와 완성한 책', '영구 삭제'],
            ['03', '계정 및 구독 정보', '삭제 처리'],
          ].map(([index, label, result]) => (
            <div key={label} className="flex min-h-[62px] items-center gap-4 border-b border-border py-3 last:border-b-0">
              <span className="w-7 font-serif text-xs text-ink-faint">{index}</span>
              <span className="flex-1 text-sm">{label}</span>
              <span className="text-[11px] font-semibold text-danger">{result}</span>
            </div>
          ))}
        </section>

        <div className="mt-8 border-l-2 border-danger pl-4">
          <p className="text-xs font-semibold">책만 잠시 쉬고 싶다면 계정을 삭제하지 않아도 돼요.</p>
          <p className="mt-1 text-[11px] leading-5 text-ink-muted">로그아웃 후 다시 돌아와도 기존 기록은 그대로 유지됩니다.</p>
        </div>

        <Button variant="danger" className="mt-8" onClick={() => setConfirmOpen(true)}>계정 영구 삭제</Button>
        <Button variant="ghost" className="mt-2" onClick={() => navigate(-1)}>취소</Button>
      </main>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="계정 삭제 확인">
        <p className="mb-5 text-sm leading-6 text-ink-muted">
          정말 삭제하려면 아래에 <strong className="text-ink">계정 삭제</strong>를 입력해주세요.
        </p>
        <Input active value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="계정 삭제" />
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <Button variant="danger" className="mt-5" disabled={!canDelete || deleting} onClick={() => void handleDelete()}>
          {deleting ? '삭제 중...' : '영구 삭제'}
        </Button>
        <Button variant="ghost" className="mt-2" onClick={() => setConfirmOpen(false)}>취소</Button>
      </Modal>
    </div>
  )
}
