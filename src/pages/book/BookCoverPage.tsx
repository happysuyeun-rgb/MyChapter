import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { COVER_TEMPLATES } from '@/constants/coverTemplates'
import { getSubscriptionPlan } from '@/lib/api/subscriptions'
import { updateProjectCoverSelection } from '@/lib/api/projects'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useAuthStore } from '@/stores/authStore'
import { useBookStore } from '@/stores/bookStore'
import { useProjectStore } from '@/stores/projectStore'
import { usePaywallStore } from '@/stores/paywallStore'
import { listRecords } from '@/lib/api/records'
import { getBookReadiness } from '@/utils/bookReadiness'

export function BookCoverPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { project, loading: projectLoading } = useActiveProject()
  const { selectedCoverId, setSelectedCoverId } = useBookStore()
  const { setActiveProject } = useProjectStore()
  const { showPaywall } = usePaywallStore()
  const [isPro, setIsPro] = useState(false)
  const [coverConfirmed, setCoverConfirmed] = useState(false)
  const [readinessChecked, setReadinessChecked] = useState(false)

  useEffect(() => {
    if (!user || !project) return
    void Promise.all([getSubscriptionPlan(user.id), listRecords(user.id, { projectId: project.id })]).then(([plan, records]) => {
      setIsPro(plan === 'pro')
      if (!getBookReadiness(project, records.length).isReady) navigate('/project/workspace', { replace: true })
      const persistedCover = project.selected_cover_id ?? project.cover_template_id
      if (persistedCover) {
        setSelectedCoverId(persistedCover)
        setCoverConfirmed(true)
      }
      setReadinessChecked(true)
    })
  }, [user, project, navigate])

  const handleSelect = async (id: string, proOnly: boolean) => {
    if (!user || !project) return
    if (proOnly && !isPro) return showPaywall()

    setSelectedCoverId(id)

    try {
      const updated = await updateProjectCoverSelection(project.id, user.id, id)
      setActiveProject(updated)
      setCoverConfirmed(true)
    } catch {
      // Keep the preview responsive; persistence will be retried on the next selection.
    }
  }

  if (projectLoading || !project || !readinessChecked) {
    return <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">로딩 중...</div>
  }

  const selectedTemplate = COVER_TEMPLATES.find((t) => t.id === selectedCoverId) ?? COVER_TEMPLATES[0]

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <NavBar title="표지 선택" leftLabel="‹ 뒤로" />
      <main className="flex-1 overflow-y-auto px-5 pb-8 pt-5">
        <h1 className="font-serif text-2xl font-bold">책의 첫인상을 골라주세요</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">내용은 그대로 두고 표지만 바꿔볼 수 있어요. 마음에 드는 한 권을 선택하세요.</p>

        <section className="mt-7 flex items-center justify-center border-y border-border py-8">
          <div className={['relative flex aspect-[3/4] w-40 flex-col justify-between rounded-r-md rounded-l-sm p-5 shadow-paper', selectedTemplate.bgClass, selectedTemplate.textClass].join(' ')}>
            <span className="text-[8px] tracking-[0.18em] opacity-60">MY CHAPTER</span>
            <div>
              <div className={['mb-5 h-px w-10', selectedTemplate.accentClass].join(' ')} />
              <p className="font-serif text-lg font-bold leading-snug">{project.title}</p>
              <p className="mt-3 text-[10px] opacity-70">{profile?.nickname ?? '작가'}</p>
            </div>
            <span className="text-[8px] opacity-50">{selectedTemplate.name}</span>
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-end justify-between">
            <div><h2 className="font-serif text-base font-bold">표지 에디션</h2><p className="mt-1 text-xs text-ink-muted">선택하면 위 표지에 바로 반영돼요.</p></div>
            <span className="text-xs font-semibold text-sage">{selectedTemplate.name}</span>
          </div>
          <div className="mt-4 border-t border-border">
            {COVER_TEMPLATES.map((template) => {
              const locked = template.proOnly && !isPro
              const selected = selectedCoverId === template.id
              return (
                <button key={template.id} type="button" className="flex w-full items-center gap-4 border-b border-border py-4 text-left" onClick={() => void handleSelect(template.id, template.proOnly)}>
                  <div className={['flex h-16 w-11 shrink-0 flex-col justify-between rounded-r-sm rounded-l-[2px] p-2', template.bgClass, template.textClass].join(' ')}>
                    <span className="text-[5px] opacity-50">MC</span><span className={['h-px w-4', template.accentClass].join(' ')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{template.name}</p>
                    <p className="mt-1 text-xs text-ink-muted">{template.proOnly ? 'Pro 에디션' : '기본 에디션 · Free'}</p>
                  </div>
                  <span className={['flex h-5 w-5 items-center justify-center rounded-full border text-[10px]', selected ? 'border-ink bg-ink text-surface' : 'border-border text-ink-faint'].join(' ')}>{selected ? '✓' : locked ? 'P' : ''}</span>
                </button>
              )
            })}
          </div>
          {!isPro && <p className="mt-4 text-xs leading-relaxed text-ink-muted">기본 에디션으로 첫 책을 무료 발행할 수 있어요. Pro 에디션은 업그레이드 후 선택할 수 있습니다.</p>}
        </section>
      </main>
      <div className="border-t border-border bg-surface px-5 py-4 safe-bottom">
        <Button disabled={!coverConfirmed} onClick={() => navigate('/book/review')}>
          {coverConfirmed ? '이 표지로 최종 검수하기' : '표지를 하나 선택해주세요'}
        </Button>
      </div>
    </div>
  )
}
