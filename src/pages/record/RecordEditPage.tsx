import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState, LoadingBlock } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { getRecord } from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'
import { useRecordStore } from '@/stores/recordStore'

const ROUTES = {
  question: '/record/write/question',
  photo: '/record/write/photo',
  free: '/record/write/free',
} as const

export function RecordEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setEditingRecord } = useRecordStore()
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!id || !user) {
      navigate('/records', { replace: true })
      return
    }
    let cancelled = false
    setLoadError(false)

    const load = async () => {
      try {
        const record = await getRecord(id, user.id)
        if (cancelled) return
        if (!record) {
          navigate('/records', { replace: true })
          return
        }
        setEditingRecord(record)
        navigate(ROUTES[record.mode], { replace: true })
      } catch {
        if (!cancelled) setLoadError(true)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [id, user, navigate, setEditingRecord, retryKey])

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
        <NavBar title="기록 수정" leftLabel="←" />
        <ErrorState
          title="기록을 불러오지 못했어요"
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <LoadingBlock label="기록을 불러오는 중..." />
    </div>
  )
}
