import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { useActiveProject } from '@/hooks/useActiveProject'
import { updateProjectSettings } from '@/lib/api/projects'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import type { ProjectType } from '@/types/database'
import { BOOK_READINESS_RULES } from '@/utils/bookReadiness'

export function ProjectSettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { project, loading } = useActiveProject()
  const { setActiveProject } = useProjectStore()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<ProjectType>('custom')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      navigate('/project/workspace', { replace: true })
    } catch {
      setError('책 설정을 저장하지 못했어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !project) {
    return <div className="flex min-h-dvh items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>
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

        {error && <p className="mt-5 text-sm text-danger">{error}</p>}
      </main>

      <div className="border-t border-border bg-surface px-5 py-4 safe-bottom">
        <Button disabled={saving || !title.trim()} onClick={() => void handleSave()}>
          {saving ? '저장 중...' : '책 설정 저장하기'}
        </Button>
      </div>
    </div>
  )
}
