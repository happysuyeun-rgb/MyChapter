import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chip, EmptyState } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { useProjectList } from '@/hooks/useActiveProject'
import { listRecords } from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'
import type { JournalRecord } from '@/types/database'

const MODE_LABEL: Record<string, string> = {
  question: '💬 질문 모드',
  photo: '📸 사진 모드',
  free: '✍️ 자유 일기',
}

function groupByMonth(records: JournalRecord[]) {
  const groups: { label: string; items: JournalRecord[] }[] = []
  let current = ''

  for (const record of records) {
    const d = new Date(record.created_at)
    const label = d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    if (label !== current) {
      current = label
      groups.push({ label, items: [] })
    }
    groups[groups.length - 1].items.push(record)
  }

  return groups
}

export function RecordsListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { projects, loading: projectsLoading } = useProjectList()
  const [records, setRecords] = useState<JournalRecord[]>([])
  const [filterProjectId, setFilterProjectId] = useState<string | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const data = await listRecords(user.id, {
        projectId: filterProjectId === 'all' ? undefined : filterProjectId,
        limit: 50,
      })
      setRecords(data)
      setLoading(false)
    }

    setLoading(true)
    void load()
  }, [user, filterProjectId])

  const groups = useMemo(() => groupByMonth(records), [records])

  if (projectsLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  if (records.length === 0 && filterProjectId === 'all' && projects.length === 0) {
    return <EmptyState variant="records" />
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <NavBar
          title="기록"
          rightLabel="+ 기록"
          onRightClick={() => navigate('/record/mode')}
        />
        <EmptyState variant="records" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <NavBar
        title="기록"
        rightLabel="+ 기록"
        rightAccent
        onRightClick={() => {
          const project = projects[0]
          if (project?.record_mode === 'daily') navigate('/record/mode')
          else if (project?.record_mode === 'photo') navigate('/record/write/photo')
          else if (project?.record_mode === 'free') navigate('/record/write/free')
          else navigate('/record/write/question')
        }}
      />

      {projects.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-b border-border px-5 py-3">
          <Chip
            active={filterProjectId === 'all'}
            onClick={() => setFilterProjectId('all')}
            className="whitespace-nowrap"
          >
            전체
          </Chip>
          {projects.map((p) => (
            <Chip
              key={p.id}
              active={filterProjectId === p.id}
              onClick={() => setFilterProjectId(p.id)}
              className="whitespace-nowrap"
            >
              {p.title}
            </Chip>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-5 pb-1.5 pt-3.5 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              {group.label}
            </p>
            {group.items.map((record) => {
              const d = new Date(record.created_at)
              const day = d.getDate()
              const weekday = d.toLocaleDateString('ko-KR', { weekday: 'short' })
              const preview =
                record.mode === 'free' && record.title
                  ? record.title
                  : record.content.slice(0, 60)

              return (
                <button
                  key={record.id}
                  type="button"
                  className="flex w-full items-start gap-3.5 border-b border-border px-5 py-3.5 text-left"
                  onClick={() => navigate(`/records/${record.id}`)}
                >
                  <div className="min-w-8 shrink-0 text-center">
                    <p className="text-base font-extrabold text-accent">{day}</p>
                    <p className="text-[10px] text-ink-faint">{weekday}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 text-[13px] font-semibold">
                      #{record.record_number} · {MODE_LABEL[record.mode]}
                    </p>
                    <p className="line-clamp-2 text-[13px] text-ink-muted">{preview}</p>
                    {record.emotion_tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {record.emotion_tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] text-ink-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-lg text-ink-faint">›</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
