import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { useProjectList } from '@/hooks/useActiveProject'
import { listRecords } from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'
import type { JournalRecord } from '@/types/database'

const MODE_LABEL: Record<string, string> = {
  question: 'AI QUESTION',
  photo: 'PHOTO NOTE',
  free: 'FREE WRITING',
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
    return <div className="flex flex-1 items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>
  }

  if (records.length === 0 && filterProjectId === 'all' && projects.length === 0) {
    return <EmptyState variant="records" />
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-1 flex-col bg-surface">
        <NavBar title="기록" rightLabel="+ 기록" onRightClick={() => navigate('/record/mode')} />
        <EmptyState variant="records" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface">
      <NavBar title="기록 아카이브" rightLabel="+ 기록" rightAccent onRightClick={() => navigate('/record/mode')} />

      <header className="px-5 pb-5 pt-6">
        <div className="flex items-end justify-between border-b border-ink pb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">PAGE ARCHIVE</p>
            <h1 className="mt-2 font-serif text-[25px] font-bold tracking-[-0.03em]">지금까지 남긴 페이지</h1>
          </div>
          <span className="font-serif text-sm text-ink-faint">{records.length} pages</span>
        </div>
      </header>

      {projects.length > 1 && (
        <div className="flex gap-5 overflow-x-auto border-b border-border px-5 pb-3">
          <button
            type="button"
            onClick={() => setFilterProjectId('all')}
            className={['min-h-9 whitespace-nowrap border-b text-[11px] font-semibold', filterProjectId === 'all' ? 'border-ink text-ink' : 'border-transparent text-ink-faint'].join(' ')}
          >
            전체
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setFilterProjectId(p.id)}
              className={['min-h-9 whitespace-nowrap border-b text-[11px] font-semibold', filterProjectId === p.id ? 'border-ink text-ink' : 'border-transparent text-ink-faint'].join(' ')}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {groups.map((group) => (
          <section key={group.label} className="pt-5">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <p className="font-serif text-sm font-bold">{group.label}</p>
              <span className="text-[10px] text-ink-faint">{group.items.length} pages</span>
            </div>
            {group.items.map((record) => {
              const d = new Date(record.created_at)
              const day = d.getDate()
              const weekday = d.toLocaleDateString('ko-KR', { weekday: 'short' })
              const preview = record.mode === 'free' && record.title ? record.title : record.content.slice(0, 80)

              return (
                <button
                  key={record.id}
                  type="button"
                  className="group flex w-full items-start gap-4 border-b border-border py-5 text-left active:bg-accent-light/30"
                  onClick={() => navigate(`/records/${record.id}`)}
                >
                  <div className="w-9 shrink-0">
                    <p className="font-serif text-xl font-bold">{day}</p>
                    <p className="mt-0.5 text-[10px] text-ink-faint">{weekday}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold tracking-[0.15em] text-sage">
                      PAGE {String(record.record_number).padStart(2, '0')} · {MODE_LABEL[record.mode]}
                    </p>
                    <p className="mt-2 line-clamp-2 font-serif text-[14px] leading-6 text-ink">{preview}</p>
                    {record.emotion_tags.length > 0 && (
                      <p className="mt-2 text-[10px] text-ink-faint">{record.emotion_tags.slice(0, 3).join(' · ')}</p>
                    )}
                  </div>
                  <span className="pt-4 text-lg text-ink-faint transition-transform group-active:translate-x-1">→</span>
                </button>
              )
            })}
          </section>
        ))}
      </div>
    </div>
  )
}
