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
    setDraft({ type: meta.type, title: meta.defaultTitle, periodDays: meta.defaultPeriodDays, frequency: meta.defaultFrequency })
    navigate('/project/new/setup')
  }

  if (loading) return <div className="flex min-h-dvh items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <header className="px-5 pb-4 pt-6">
        <button type="button" className="mb-5 text-sm text-ink-muted" onClick={() => navigate(-1)}>← 돌아가기</button>
        <p className="text-xs font-semibold tracking-[0.18em] text-sage">NEW BOOK</p>
        <h1 className="mt-2 font-serif text-2xl font-bold">어떤 이야기를<br />한 권으로 만들까요?</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">주제는 시작을 돕는 가이드예요. 나중에 바꿔도 기록은 그대로 남아요.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 px-5 pb-8">
        {PROJECT_TYPES.map((meta) => (
          <button key={meta.type} type="button" onClick={() => handleSelect(meta)} className="min-h-36 rounded-card border border-border bg-surface-card p-4 text-left shadow-paper transition-transform active:scale-[.98]">
            <span className="text-2xl">{meta.emoji}</span>
            <p className="mt-3 font-serif text-[15px] font-bold">{meta.label}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">{meta.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
