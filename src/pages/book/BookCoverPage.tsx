import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { COVER_TEMPLATES } from '@/constants/coverTemplates'
import { listChapters } from '@/lib/api/chapters'
import {
  BookApiError,
  downloadPdfFromUrl,
  generateBookPdf,
} from '@/lib/api/books'
import { listRecords } from '@/lib/api/records'
import { getSubscriptionPlan } from '@/lib/api/subscriptions'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useAuthStore } from '@/stores/authStore'
import { useBookStore } from '@/stores/bookStore'
import { usePaywallStore } from '@/stores/paywallStore'

export function BookCoverPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { project, loading: projectLoading } = useActiveProject()
  const { selectedCoverId, setSelectedCoverId, setPublishResult } = useBookStore()
  const { showPaywall } = usePaywallStore()

  const [isPro, setIsPro] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (!user) return
    void getSubscriptionPlan(user.id).then((plan) => setIsPro(plan === 'pro'))
  }, [user])

  const handleSelect = (id: string, proOnly: boolean) => {
    if (proOnly && !isPro) {
      showPaywall()
      return
    }
    setSelectedCoverId(id)
  }

  const handlePublish = async () => {
    if (!user || !project) return

    if (!isPro) {
      showPaywall()
      return
    }

    setPublishing(true)
    try {
      const chapters = await listChapters(project.id)
      if (chapters.length === 0) {
        navigate('/book', { replace: true })
        return
      }

      const records = await listRecords(user.id, { projectId: project.id })

      const { pdfUrl, pageCount } = await generateBookPdf(
        project.id,
        selectedCoverId,
      )

      downloadPdfFromUrl(pdfUrl, `${project.title}.pdf`)

      setPublishResult({
        project,
        recordCount: records.length,
        pageCount,
        coverTemplateId: selectedCoverId,
      })

      navigate('/book/publish/complete')
    } catch (err) {
      if (err instanceof BookApiError && err.code === 'PDF_PRO_ONLY') {
        showPaywall()
      } else if (err instanceof BookApiError && err.code === 'PDF_GENERATE_FAILED') {
        console.error(err.message)
      }
    } finally {
      setPublishing(false)
    }
  }

  if (projectLoading || !project) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  const selectedTemplate = COVER_TEMPLATES.find((t) => t.id === selectedCoverId)

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <NavBar title="표지 선택" leftLabel="‹ 뒤로" />

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="mb-4 text-sm text-ink-muted">
          마음에 드는 표지를 골라주세요
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {COVER_TEMPLATES.map((template) => {
            const locked = template.proOnly && !isPro
            const selected = selectedCoverId === template.id

            return (
              <button
                key={template.id}
                type="button"
                className={[
                  'relative overflow-hidden rounded-card border-2 p-1 transition-colors',
                  selected ? 'border-accent' : 'border-border',
                  locked ? 'opacity-70' : '',
                ].join(' ')}
                onClick={() => handleSelect(template.id, template.proOnly)}
              >
                <div
                  className={[
                    'flex aspect-[3/4] flex-col items-center justify-center rounded-[10px] p-3',
                    template.bgClass,
                    template.textClass,
                  ].join(' ')}
                >
                  {template.emoji && <span className="mb-2 text-2xl">{template.emoji}</span>}
                  <p className="text-center text-xs font-bold leading-tight">{project.title}</p>
                  <p className="mt-2 text-[10px] opacity-70">{profile?.nickname ?? '작가'}</p>
                </div>
                <p className="mt-2 text-center text-xs font-medium">{template.name}</p>
                {template.proOnly && (
                  <span className="absolute right-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">
                    Pro
                  </span>
                )}
                {locked && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-card bg-black/20 text-lg">
                    🔒
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {selectedTemplate && (
          <Card className="p-4">
            <p className="text-sm font-semibold">선택한 표지</p>
            <p className="mt-1 text-xs text-ink-muted">{selectedTemplate.name}</p>
            {!isPro && (
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                PDF 출판은 Pro 플랜이 필요해요.
              </p>
            )}
          </Card>
        )}
      </div>

      <div className="border-t border-border px-5 py-4">
        <Button disabled={publishing} onClick={() => void handlePublish()}>
          {publishing ? '출판 준비 중...' : isPro ? 'PDF 출판하기' : 'Pro로 출판하기'}
        </Button>
      </div>
    </div>
  )
}
