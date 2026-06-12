import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, EmptyState } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { COVER_TEMPLATES } from '@/constants/coverTemplates'
import { listPublishedBooks, type PublishedBookWithProject } from '@/lib/api/books'
import { useAuthStore } from '@/stores/authStore'

export function CompletedBooksPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [books, setBooks] = useState<PublishedBookWithProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void listPublishedBooks(user.id).then((data) => {
      setBooks(data)
      setLoading(false)
    })
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
        로딩 중...
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar title="완성한 책" leftLabel="‹ 뒤로" />

      {books.length === 0 ? (
        <EmptyState variant="book" />
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {books.map((book) => {
            const cover = COVER_TEMPLATES.find((t) => t.id === book.cover_template_id)
            return (
              <Card key={book.id} className="flex items-center gap-4 p-4">
                <div
                  className={[
                    'flex h-16 w-12 shrink-0 items-center justify-center rounded-md text-lg',
                    cover?.bgClass ?? 'bg-ink',
                    cover?.textClass ?? 'text-white',
                  ].join(' ')}
                >
                  {cover?.emoji ?? '📖'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{book.project_title}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {new Date(book.published_at).toLocaleDateString('ko-KR')} 출판
                    {book.page_count ? ` · ${book.page_count}페이지` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-accent"
                  onClick={() => navigate('/book')}
                >
                  보기
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
