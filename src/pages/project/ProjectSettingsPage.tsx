import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ErrorState, Input, LoadingBlock, Modal } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { useActiveProject } from '@/hooks/useActiveProject'
import { archiveProject, deleteProject, updateProjectSettings } from '@/lib/api/projects'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import { useToastStore } from '@/stores/toastStore'
import type { ProjectType } from '@/types/database'
import { BOOK_READINESS_RULES } from '@/utils/bookReadiness'

export function ProjectSettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { project, loading, error: projectError, retry } = useActiveProject()
  const { setActiveProject } = useProjectStore()
  const { showToast } = useToastStore()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<ProjectType>('custom')
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    if (!project) return
    setTitle(project.title)
    setType(project.type)
  }, [project])

  const selectedMeta = useMemo(
    () => PROJECT_TYPES.find((item) => item.type === type),
    [type],
  )
  const readiness = BOOK_READINESS_RULES[type]
  const canDelete = confirmText === '책 삭제'

  const handleSave = async () => {
    if (!user || !project || !title.trim()) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateProjectSettings(project.id, user.id, {
        title: title.trim(),
        type,
      })
      setActiveProject(updated)
      showToast('책 설정을 저장했어요.')
      navigate('/project/workspace', { replace: true })
    } catch {
      setError('책 설정을 저장하지 못했어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!user || !project || busy) return
    setBusy(true)
    setModalError('')
    try {
      await archiveProject(project.id, user.id)
      setActiveProject(null)
      setArchiveOpen(false)
      showToast('책을 보관했어요.')
      navigate('/library', { replace: true })
    } catch {
      setModalError('책을 보관하지 못했어요. 다시 시도해주세요.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !project || !canDelete || busy) return
    setBusy(true)
    setModalError('')
    try {
      await deleteProject(project.id, user.id)
      setActiveProject(null)
      setDeleteOpen(false)
      showToast('책을 삭제했어요.')
      navigate('/library', { replace: true })
    } catch {
      setModalError('책을 삭제하지 못했어요. 다시 시도해주세요.')
    } finally {
      setBusy(false)
    }
  }

  const closeArchive = () => {
    setArchiveOpen(false)
    setModalError('')
  }

  const closeDelete = () => {
    setDeleteOpen(false)
    setModalError('')
  }

  if (projectError) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
        <NavBar title="책 설정" leftLabel="←" />
        <ErrorState title="책 정보를 불러오지 못했어요" onRetry={retry} />
      </div>
    )
  }

  if (loading || !project) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
        <LoadingBlock />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar title="책 설정" leftLabel="←" />

      <main className="flex-1 overflow-y-auto px-5 pb-8 pt-6">
        <header className="border-b border-ink pb-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">BOOK SETTINGS</p>
          <h1 className="mt-2 font-serif text-[26px] font-bold tracking-[-0.03em]">이 책의 기본 정보를 다듬어요.</h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            제목과 책 유형을 바꿀 수 있어요. 이미 책 만들기가 열린 경우에는 다시 잠기지 않아요.
          </p>
        </header>

        <section className="mt-8">
          <label className="mb-2 block text-[10px] font-semibold tracking-[0.16em] text-ink-faint">BOOK TITLE</label>
          <Input
            active
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            placeholder="책 제목"
            className="font-serif text-[20px] font-bold"
          />
        </section>

        <section className="mt-9">
          <div className="flex items-end justify-between border-b border-ink pb-2">
            <h2 className="font-serif text-base font-bold">책 유형</h2>
            <span className="text-[10px] tracking-[0.14em] text-ink-faint">TYPE</span>
          </div>
          <div>
            {PROJECT_TYPES.map((item, index) => {
              const selected = item.type === type
              return (
                <button
                  key={item.type}
                  type="button"
                  className={['flex w-full items-start gap-4 border-b border-border py-4 text-left', selected ? 'border-l-2 border-l-sage pl-3' : ''].join(' ')}
                  onClick={() => setType(item.type)}
                >
                  <span className="w-7 shrink-0 font-serif text-xs text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-sm font-bold">{item.label}</span>
                    <span className="mt-1 block text-[11px] leading-5 text-ink-muted">{item.description}</span>
                  </span>
                  <span className={['pt-1 text-xs font-semibold', selected ? 'text-sage' : 'text-ink-faint'].join(' ')}>
                    {selected ? '선택됨' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {selectedMeta && readiness && (
          <section className="mt-8 border-y border-border py-5">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-sage">READINESS POLICY</p>
            <p className="mt-2 font-serif text-base font-bold">{selectedMeta.label}</p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              최소 {readiness.minDays}일 · 기록 {readiness.minRecords}개가 쌓이면 책 만들기가 열려요.
            </p>
            {project.ready_at && (
              <p className="mt-3 text-[11px] font-semibold text-terracotta">
                이 책은 이미 준비 완료 상태라 유형을 바꿔도 다시 잠기지 않아요.
              </p>
            )}
          </section>
        )}

        <section className="mt-10 border-t border-border pt-6">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-ink-faint">SHELF ACTIONS</p>
          <h2 className="mt-2 font-serif text-base font-bold">서재에서 이 책 다루기</h2>
          <p className="mt-2 text-xs leading-5 text-ink-muted">
            보관은 선반에서만 내리고, 삭제는 기록·원고까지 함께 지워요. Free 플랜에서 새 책을 만들려면 삭제가 필요할 수 있어요.
          </p>
          <button
            type="button"
            className="mt-5 flex min-h-12 w-full items-center justify-between border border-border px-4 text-left active:bg-accent-light/40"
            onClick={() => setArchiveOpen(true)}
          >
            <span>
              <span className="block text-sm font-semibold text-ink">서재에서 보관</span>
              <span className="mt-1 block text-[11px] text-ink-muted">선반 목록에서 숨겨요</span>
            </span>
            <span className="text-ink-faint">→</span>
          </button>
          <button
            type="button"
            className="mt-3 flex min-h-12 w-full items-center justify-between border border-danger/30 px-4 text-left active:bg-danger/5"
            onClick={() => {
              setConfirmText('')
              setDeleteOpen(true)
            }}
          >
            <span>
              <span className="block text-sm font-semibold text-danger">책 영구 삭제</span>
              <span className="mt-1 block text-[11px] text-ink-muted">복구할 수 없어요</span>
            </span>
            <span className="text-danger/50">→</span>
          </button>
        </section>

        {error && <p className="mt-5 text-sm text-danger">{error}</p>}
      </main>

      <div className="border-t border-border bg-surface px-5 py-4 safe-bottom">
        <Button disabled={saving || !title.trim()} onClick={() => void handleSave()}>
          {saving ? '저장 중...' : '책 설정 저장하기'}
        </Button>
      </div>

      <Modal open={archiveOpen} onClose={closeArchive} title="책을 보관할까요?">
        <p className="mb-5 text-sm leading-6 text-ink-muted">
          <strong className="text-ink">{project.title}</strong>을(를) 서재 선반에서 내려요. 기록은 유지되지만 목록에는 보이지 않아요.
        </p>
        {modalError && <p className="mb-3 text-sm text-danger">{modalError}</p>}
        <Button disabled={busy} onClick={() => void handleArchive()}>
          {busy ? '보관 중...' : '서재에서 보관'}
        </Button>
        <Button variant="ghost" className="mt-2" onClick={closeArchive}>
          취소
        </Button>
      </Modal>

      <Modal open={deleteOpen} onClose={closeDelete} title="책 삭제 확인">
        <p className="mb-5 text-sm leading-6 text-ink-muted">
          정말 삭제하려면 아래에 <strong className="text-ink">책 삭제</strong>를 입력해주세요. 원본 기록과 원고도 함께 사라질 수 있어요.
        </p>
        <Input
          active
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="책 삭제"
        />
        {modalError && <p className="mt-3 text-sm text-danger">{modalError}</p>}
        <Button
          variant="danger"
          className="mt-5"
          disabled={!canDelete || busy}
          onClick={() => void handleDelete()}
        >
          {busy ? '삭제 중...' : '영구 삭제'}
        </Button>
        <Button variant="ghost" className="mt-2" onClick={closeDelete}>
          취소
        </Button>
      </Modal>
    </div>
  )
}
