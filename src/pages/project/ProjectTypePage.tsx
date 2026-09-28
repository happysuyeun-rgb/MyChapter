import { useNavigate } from 'react-router-dom'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { useProjectLimit } from '@/hooks/useProjectLimit'
import { usePaywallStore } from '@/stores/paywallStore'
import { useProjectStore } from '@/stores/projectStore'
import type { ProjectTypeMeta } from '@/constants/projectTypes'

export function ProjectTypePage() {
  const navigate = useNavigate()
  const { setDraft } = useProjectStore()
  const { loading, canCreate } = useProjectLimit()
  const { showPaywall } = usePaywallStore()

  const handleSelect = (meta: ProjectTypeMeta) => {
    if (!canCreate) {
      showPaywall()
      return
    }
    setDraft({
      type: meta.type,
      title: meta.defaultTitle,
      periodDays: meta.defaultPeriodDays,
      frequency: meta.defaultFrequency,
    })
    navigate('/project/new/setup')
  }

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <header className="px-5 pb-7 pt-6">
        <button type="button" className="flex min-h-11 items-center text-sm text-ink-muted" onClick={() => navigate(-1)}>
          ← 내 서재
        </button>
        <div className="mt-7 border-b border-ink pb-6">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-sage">NEW BOOK · 01</p>
          <h1 className="mt-3 font-serif text-[30px] font-bold leading-[1.32] tracking-[-0.03em]">
            어떤 이야기를
            <br />
            한 권으로 남길까요?
          </h1>
          <p className="mt-4 max-w-[330px] text-sm leading-6 text-ink-muted">
            책의 주제는 PAGE가 질문과 이야기의 방향을 잡는 기준이에요. 나중에 바꿔도 기록은 그대로 남습니다.
          </p>
        </div>
      </header>

      <main className="flex-1 px-5 pb-10">
        <div className="border-t border-border">
          {PROJECT_TYPES.map((meta, index) => (
            <button
              key={meta.type}
              type="button"
              onClick={() => handleSelect(meta)}
              className="group flex min-h-[88px] w-full items-center gap-4 border-b border-border py-4 text-left active:bg-accent-light/40"
            >
              <span className="w-7 shrink-0 font-serif text-xs text-ink-faint">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-[17px] font-bold tracking-[-0.02em] text-ink">
                  {meta.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-ink-muted">
                  {meta.description}
                </span>
              </span>
              <span className="shrink-0 text-lg text-ink-faint transition-transform group-active:translate-x-1">→</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-[11px] leading-5 text-ink-faint">
          선택한 주제는 글의 방향을 돕는 편집 기준일 뿐, 기록할 내용을 제한하지 않아요.
        </p>
      </main>
    </div>
  )
}
