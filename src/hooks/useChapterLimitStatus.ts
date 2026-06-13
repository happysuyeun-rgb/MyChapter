import { useEffect, useState } from 'react'
import { getUnassignedRecordCount, listChapters } from '@/lib/api/chapters'
import { useSubscription } from '@/hooks/useSubscription'

export function useChapterLimitStatus(projectId: string | undefined) {
  const { isPro } = useSubscription()
  const [chapterLimitReached, setChapterLimitReached] = useState(false)
  const [loading, setLoading] = useState(Boolean(projectId))

  useEffect(() => {
    if (!projectId || isPro) {
      setChapterLimitReached(false)
      setLoading(false)
      return
    }

    setLoading(true)

    void Promise.all([
      listChapters(projectId),
      getUnassignedRecordCount(projectId),
    ]).then(([chapters, unassigned]) => {
      setChapterLimitReached(chapters.length >= 3 && unassigned >= 10)
      setLoading(false)
    })
  }, [projectId, isPro])

  return { chapterLimitReached, loading }
}
