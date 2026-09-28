import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { PROJECT_TYPES } from '@/constants/projectTypes'
import { createProject } from '@/lib/api/projects'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import { BOOK_READINESS_RULES } from '@/utils/bookReadiness'

export function ProjectSetupPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { draft, setDraft, setCreatedProject, setActiveProject } = useProjectStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const typeMeta = PROJECT_TYPES.find((p) => p.type === draft.type)

  useEffect(() => {
    if (!draft.type) navigate('/project/new', { replace: true })
  }, [draft.type, navigate])

  if (!draft.type || !typeMeta) return null

  const readiness = BOOK_READINESS_RULES[draft.type]

  const handleStart = async () => {
    if (!user || !draft.title.trim()) return
    setLoading(true)
    setError('')
    try {
      // period/frequency/recordMode remain compatibility fields until DB v2 migration.
      const project = await createProject(user.id, { ...draft, recordMode: 'daily' })
      setDraft({ recordMode: 'daily' })
      setCreatedProject(project)
      setActiveProject(project)
      navigate('/project/new/complete')
    } catch {
      setError('책을 시작하지 못했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar title={typeMeta.label} leftLabel="←" />
      <main className="flex-1 overflow-y-auto px-5 pb-8 pt-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-sage">NEW BOOK</p>
        <h1 className="mt-2 font-serif text-2xl font-bold">이 책의 제목을 정해주세요</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">제목은 나중에 바꿀 수 있어요. 지금은 기록을 시작할 수 있을 만큼만 정하면 됩니다.</p>

        <div className="mt-7">
          <label className="mb-2 block text-xs font-semibold text-ink-muted">책 제목</label>
          <Input
            active
            value={draft.title}
            onChange={(e) => setDraft({ title: e.target.value })}
            placeholder="책 제목을 입력해주세요"
            maxLength={50}
          />
        </div>

        <section className="mt-8 border-y border-border py-5">
          <p className="font-serif text-base font-bold">책 만들기는 이야기가 충분히 쌓이면 열려요</p>
          {readiness ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {typeMeta.label}는 최소 <strong className="text-ink">{readiness.minDays}일</strong> 동안
                <strong className="text-ink"> {readiness.minRecords}개의 기록</strong>이 쌓이면 챕터와 원고 만들기를 시작할 수 있어요.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-ink-faint">
                매일 쓰지 않아도 괜찮아요. MY CHAPTER는 기록 횟수와 시간이 함께 쌓이는 과정을 봅니다.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">기록이 충분히 쌓이면 PAGE가 책 만들기를 안내해드려요.</p>
          )}
        </section>

        <section className="mt-8">
          <p className="font-serif text-base font-bold">기록 방식은 매번 선택해요</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">AI 질문으로 시작하거나, 자유롭게 쓰거나, 사진과 함께 남길 수 있어요. 한 가지 방식으로 고정되지 않습니다.</p>
        </section>

        {error && <p className="mt-5 text-sm text-danger">{error}</p>}
      </main>

      <div className="border-t border-border bg-surface px-5 py-4 safe-bottom">
        <Button disabled={!draft.title.trim() || loading} onClick={() => void handleStart()}>
          {loading ? '책 만드는 중...' : '이 책 시작하기'}
        </Button>
      </div>
    </div>
  )
}
