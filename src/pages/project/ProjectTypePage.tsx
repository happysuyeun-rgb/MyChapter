import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { useProjectLimit } from '@/hooks/useProjectLimit'
import { useProjectStore } from '@/stores/projectStore'
import type { ProjectTypeMeta } from '@/constants/projectTypes'

export function ProjectTypePage() {
  const navigate = useNavigate()
  const { setDraft } = useProjectStore()
  const { loading, canCreate } = useProjectLimit()

  const handleSelect = (meta: ProjectTypeMeta) => {
    if (!canCreate) return

    setDraft({
      type: meta.type,
      title: meta.defaultTitle,
      periodDays: meta.defaultPeriodDays,
      frequency: meta.defaultFrequency,
    })
    navigate('/project/new/setup')
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar title="새 책 프로젝트" leftLabel="←" />
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-5">
          <h1 className="mb-1.5 text-lg font-bold">어떤 책을 쓸까요?</h1>
          <p className="mb-5 text-sm text-ink-muted">
            주제를 선택하면 AI가 루틴을 설계해드려요
          </p>
        </div>

        <div className="space-y-2.5 px-5 pb-5">
          {PROJECT_TYPES.map((meta) => (
            <button
              key={meta.type}
              type="button"
              disabled={!canCreate}
              onClick={() => handleSelect(meta)}
              className="w-full text-left disabled:opacity-50"
            >
              <Card
                accent={meta.type === 'emotion'}
                className="flex items-center gap-3.5 p-4"
              >
                <span className="text-[32px]">{meta.emoji}</span>
                <div>
                  <p
                    className={[
                      'mb-0.5 text-sm font-bold',
                      meta.type === 'emotion' ? 'text-accent' : 'font-semibold text-ink',
                    ].join(' ')}
                  >
                    {meta.label}
                  </p>
                  <p className="text-sm text-ink-muted">{meta.description}</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
