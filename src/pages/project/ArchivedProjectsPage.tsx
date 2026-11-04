import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ErrorState, Input, LoadingBlock, Modal } from '@/components/common'
import { BrandMasthead } from '@/components/layout/BrandMasthead'
import bookDefaultCover from '@/assets/images/home/Book_defualt.png'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { deleteProject, getArchivedProjects, restoreProject } from '@/lib/api/projects'
import { listRecords } from '@/lib/api/records'
import { useProjectLimit } from '@/hooks/useProjectLimit'
import { useAuthStore } from '@/stores/authStore'
import type { Project } from '@/types/database'

interface ArchivedProject extends Project {
  recordCount: number
}

function formatArchivedDate(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${mm}.${dd}`
}

export function ArchivedProjectsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isPro, loading: limitLoading } = useProjectLimit()
  const [projects, setProjects] = useState<ArchivedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null)
  const [notice, setNotice] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ArchivedProject | null>(null)
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError(false)
      try {
        const archived = await getArchivedProjects(user.id)
        const withCounts = await Promise.all(
          archived.map(async (project) => {
            const records = await listRecords(user.id, { projectId: project.id })
            return { ...project, recordCount: records.length }
          }),
        )
        if (!cancelled) setProjects(withCounts)
      } catch {
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [user, retryKey])

  const handleRestore = async (project: ArchivedProject) => {
    if (!user || busyId) return
    setBusyId(project.id)
    setRowError(null)
    setNotice('')
    try {
      await restoreProject(project.id, user.id)
      setProjects((prev) => prev.filter((item) => item.id !== project.id))
      setNotice(`「${project.title}」을(를) 서재로 꺼냈어요.`)
    } catch {
      setRowError({ id: project.id, message: '서재로 꺼내지 못했어요. 다시 시도해주세요.' })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!user || !deleteTarget || confirmText !== '책 삭제' || busyId) return
    const target = deleteTarget
    setBusyId(target.id)
    setRowError(null)
    setNotice('')
    try {
      await deleteProject(target.id, user.id)
      setProjects((prev) => prev.filter((item) => item.id !== target.id))
      setDeleteTarget(null)
      setNotice(`「${target.title}」을(를) 삭제했어요.`)
    } catch {
      setDeleteTarget(null)
      setRowError({ id: target.id, message: '책을 삭제하지 못했어요. 다시 시도해주세요.' })
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <LoadingBlock label="보관함을 불러오는 중..." />
  if (loadError) {
    return (
      <ErrorState
        title="보관함을 불러오지 못했어요"
        onRetry={() => setRetryKey((k) => k + 1)}
      />
    )
  }

  return (
    <div className="desk-fade-in flex flex-1 flex-col overflow-y-auto bg-surface">
      <header className="px-5 pb-5 pt-4">
        <BrandMasthead
          left={
            <button
              type="button"
              className="flex min-h-11 items-center text-sm text-ink-muted"
              onClick={() => navigate('/library')}
              aria-label="서재로"
            >
              ←
            </button>
          }
        />
        <div className="mt-4">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-sage">ARCHIVE</p>
          <h1 className="mt-1 font-serif text-[32px] font-bold tracking-[-0.03em]">보관함</h1>
          <p className="mt-2 text-xs text-ink-muted">{projects.length}권 · 잠시 내려둔 책</p>
        </div>
      </header>

      <main className="px-5 pb-10">
        {!limitLoading && !isPro && projects.length > 0 && (
          <p className="border-l-2 border-sage pl-4 text-xs leading-5 text-ink-muted">
            보관한 책도 Free 1권에 포함돼요. 새 책을 만들려면 보관한 책을 삭제하거나 Pro로 전환하세요.
          </p>
        )}

        {notice && (
          <p role="status" className="mt-4 text-xs font-semibold text-sage">
            {notice}
          </p>
        )}

        {projects.length === 0 ? (
          <div className="mt-6 border-t border-ink py-10">
            <h2 className="font-serif text-[22px] font-bold tracking-[-0.02em]">보관한 책이 없어요</h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted">서재에서 잠시 내려둔 책이 여기에 모여요.</p>
            <Button className="mt-7" variant="secondary" onClick={() => navigate('/library')}>
              서재로 돌아가기
            </Button>
          </div>
        ) : (
          <div className="mt-4 border-t border-border">
            {projects.map((project) => {
              const typeLabel = PROJECT_TYPES.find((p) => p.type === project.type)?.label ?? '나의 기록'
              const busy = busyId === project.id
              return (
                <div key={project.id} className="border-b border-border py-6">
                  <div className="flex gap-5">
                    <div className="relative h-[96px] w-[64px] shrink-0 opacity-80">
                      <img
                        src={bookDefaultCover}
                        alt=""
                        width={64}
                        height={96}
                        className="h-full w-full object-contain"
                        decoding="async"
                      />
                      <div className="pointer-events-none absolute inset-x-[10%] top-[10%] flex h-[40%] items-center justify-center px-0.5">
                        <span className="line-clamp-3 text-center font-serif text-[8px] font-bold leading-[1.3] text-ink">
                          {project.title}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold tracking-[0.12em] text-ink-faint">
                        보관 {formatArchivedDate(project.archived_at)}
                      </p>
                      <h2 className="mt-2 line-clamp-2 font-serif text-[17px] font-bold leading-snug tracking-[-0.02em]">
                        {project.title}
                      </h2>
                      <p className="mt-1 text-xs text-ink-muted">
                        {typeLabel} · 기록 {project.recordCount}개
                      </p>
                      <div className="mt-4 flex items-center gap-5">
                        <button
                          type="button"
                          className="min-h-11 text-xs font-semibold text-sage underline underline-offset-4 disabled:opacity-50"
                          disabled={busy}
                          onClick={() => void handleRestore(project)}
                        >
                          {busy && !deleteTarget ? '꺼내는 중...' : '서재로 꺼내기'}
                        </button>
                        <button
                          type="button"
                          className="min-h-11 text-xs font-semibold text-danger disabled:opacity-50"
                          disabled={busy}
                          onClick={() => {
                            setConfirmText('')
                            setDeleteTarget(project)
                          }}
                        >
                          영구 삭제
                        </button>
                      </div>
                      {rowError?.id === project.id && (
                        <p role="alert" className="mt-2 text-xs text-danger">
                          {rowError.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="책 삭제 확인">
        <p className="mb-5 text-sm leading-6 text-ink-muted">
          <strong className="text-ink">{deleteTarget?.title}</strong>을(를) 영구 삭제하려면 아래에{' '}
          <strong className="text-ink">책 삭제</strong>를 입력해주세요. 원본 기록과 원고도 함께 사라져요.
        </p>
        <Input
          active
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="책 삭제"
        />
        <Button
          variant="danger"
          className="mt-5"
          disabled={confirmText !== '책 삭제' || Boolean(busyId)}
          onClick={() => void handleDelete()}
        >
          {busyId ? '삭제 중...' : '영구 삭제'}
        </Button>
        <Button variant="ghost" className="mt-2" onClick={() => setDeleteTarget(null)}>
          취소
        </Button>
      </Modal>
    </div>
  )
}
