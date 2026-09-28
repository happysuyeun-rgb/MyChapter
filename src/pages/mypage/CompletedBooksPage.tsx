import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/common'
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
    void listPublishedBooks(user.id)
      .then((data) => setBooks(data))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return <div className="flex flex-1 items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar title="완성한 책" leftLabel="←" />

      {books.length === 0 ? (
        <EmptyState variant="book" />
      ) : (
        <main className="flex-1 overflow-y-auto px-5 pb-10 pt-6">
          <header className="flex items-end justify-between border-b border-ink pb-5">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-sage">PUBLISHED SHELF</p>
              <h1 className="mt-2 font-serif text-[26px] font-bold tracking-[-0.03em]">발행한 책</h1>
            </div>
            <span className="font-serif text-sm text-ink-faint">{books.length} books</span>
          </header>

          <div>
            {books.map((book, index) => {
              const cover = COVER_TEMPLATES.find((t) => t.id === book.cover_template_id)
              return (
                <button
                  key={book.id}
                  type="button"
                  className="group flex w-full gap-5 border-b border-border py-6 text-left active:bg-accent-light/30"
                  onClick={() => navigate(`/publication/${book.id}`)}
                >
                  <div
                    className={[
                      'flex h-[126px] w-[84px] shrink-0 flex-col justify-between rounded-r-md rounded-l-[3px] p-3 shadow-[7px_8px_0_rgba(59,53,45,.10)]',
                      cover?.bgClass ?? 'bg-ink',
                      cover?.textClass ?? 'text-white',
                    ].join(' ')}
                  >
                    <span className="text-[6px] tracking-[0.18em] opacity-55">MY CHAPTER</span>
                    <div>
                      <span className={['mb-3 block h-px w-6', cover?.accentClass ?? 'bg-sage'].join(' ')} />
                      <span className="line-clamp-4 font-serif text-[11px] font-bold leading-[1.45]">{book.project_title}</span>
                    </div>
                    <span className="text-[6px] opacity-55">PUBLISHED</span>
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-[9px] font-semibold tracking-[0.15em] text-sage">
                      BOOK {String(index + 1).padStart(2, '0')}
                    </p>
                    <h2 className="mt-2 line-clamp-2 font-serif text-[18px] font-bold leading-snug">{book.project_title}</h2>
                    <p className="mt-3 text-[11px] leading-5 text-ink-muted">
                      {new Date(book.published_at).toLocaleDateString('ko-KR')} 발행
                      {book.page_count ? ` · 약 ${book.page_count}페이지` : ''}
                    </p>
                    <p className="mt-5 text-xs font-semibold">발행본 열기 →</p>
                  </div>
                </button>
              )
            })}
          </div>
        </main>
      )}
    </div>
  )
}
