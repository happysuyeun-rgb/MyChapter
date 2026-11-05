import { useCallback, useEffect, useState } from 'react'
import { listChapters } from '@/lib/api/chapters'
import { getPublishedBook } from '@/lib/api/books'
import { getProjects } from '@/lib/api/projects'
import { listRecords } from '@/lib/api/records'
import { useAuthStore } from '@/stores/authStore'
import { calculateStreak } from '@/utils/streak'

export interface UserStats {
  recordCount: number
  chapterCount: number
  bookCount: number
  streak: number
}

export function useUserStats() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<UserStats>({
    recordCount: 0,
    chapterCount: 0,
    bookCount: 0,
    streak: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const load = async () => {
      try {
        const [records, projects] = await Promise.all([
          listRecords(user.id),
          getProjects(user.id),
        ])

        const chapterLists = await Promise.all(
          projects.map((p) => listChapters(p.id)),
        )
        const chapterCount = chapterLists.reduce((sum, list) => sum + list.length, 0)

        const bookResults = await Promise.all(
          projects.map((p) => getPublishedBook(p.id)),
        )
        const bookCount = bookResults.filter(Boolean).length

        if (cancelled) return
        setStats({
          recordCount: records.length,
          chapterCount,
          bookCount,
          streak: calculateStreak(records),
        })
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    setError(false)
    void load()
    return () => { cancelled = true }
  }, [user, retryKey])

  const retry = useCallback(() => setRetryKey((key) => key + 1), [])

  return { stats, loading, error, retry }
}
