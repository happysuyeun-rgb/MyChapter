import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

  useEffect(() => {
    if (!id || !user) {
      navigate('/records', { replace: true })
      return
    }

    const load = async () => {
      const record = await getRecord(id, user.id)
      if (!record) {
        navigate('/records', { replace: true })
        return
      }
      setEditingRecord(record)
      navigate(ROUTES[record.mode], { replace: true })
    }

    void load()
  }, [id, user, navigate, setEditingRecord])

  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
      불러오는 중...
    </div>
  )
}
