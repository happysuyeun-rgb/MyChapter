import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/common'
import { NavBar } from '@/components/layout/NavBar'
import { COVER_TEMPLATES } from '@/constants/coverTemplates'
import {
  getPublishedBookById,
  getPublishedBookSignedUrl,
  type PublishedBookWithProject,
} from '@/lib/api/books'
import { useAuthStore } from '@/stores/authStore'

export function PublishedBookPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [book, setBook] = useState<PublishedBookWithProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !id) return

    void getPublishedBookById(user.id, id)
      .then((data) => {
        if (!data) {
          navigate('/mypage/completed-books', { replace: true })
          return
        }
        setBook(data)
      })
      .catch(() => setError('발행한 책 정보를 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [user, id, navigate])

  const handleOpenPdf = async () => {
    if (!book) return
    setOpening(true)
    setError('')
    try {
      const url = await getPublishedBookSignedUrl(book.pdf_url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setError('PDF를 열지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setOpening(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center bg-surface text-sm text-ink-muted">로딩 중...</div>
  }

  if (!book) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-6 text-center">
        <p className="font-serif text-lg font-bold">책을 찾을 수 없어요.</p>
        <Button className="mt-5" variant="secondary" onClick={() => navigate('/mypage/completed-books')}>완성한 책으로 돌아가기</Button>
      </div>
    )
  }

  const cover = COVER_TEMPLATES.find((item) => item.id === book.cover_template_id)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar title="완성한 책" leftLabel="‹ 뒤로" />
      <main className="flex-1 overflow-y-auto px-5 pb-8 pt-6">
        <section className="flex flex-col items-center border-y border-border py-8 text-center">
          <div className={['flex aspect-[3/4] w-36 flex-col justify-between rounded-r-md rounded-l-sm p-5 shadow-paper', cover?.bgClass ?? 'bg-ink', cover?.textClass ?? 'text-white'].join(' ')}>
            <span className="text-[8px] tracking-[0.18em] opacity-60">MY CHAPTER</span>
            <div>
              <span className={['mx-auto mb-5 block h-px w-10', cover?.accentClass ?? 'bg-sage'].join(' ')} />
              <p className="font-serif text-base font-bold leading-snug">{book.project_title}</p>
            </div>
            <span className="text-[8px] opacity-50">{cover?.name ?? 'MY CHAPTER'}</span>
          </div>
          <h1 className="mt-6 font-serif text-2xl font-bold">{book.project_title}</h1>
          <p className="mt-2 text-xs text-ink-muted">
            {new Date(book.published_at).toLocaleDateString('ko-KR')} 발행
            {book.page_count ? ` · 약 ${book.page_count}페이지` : ''}
          </p>
        </section>

        <section className="mt-7">
          <h2 className="font-serif text-base font-bold">발행본</h2>
          <div className="mt-3 border-y border-border">
            <div className="flex items-center justify-between py-4 text-sm">
              <span className="text-ink-muted">형식</span><span className="font-semibold">PDF</span>
            </div>
            <div className="flex items-center justify-between border-t border-border py-4 text-sm">
              <span className="text-ink-muted">표지</span><span className="font-semibold">{cover?.name ?? book.cover_template_id}</span>
            </div>
          </div>
        </section>

        {error && <p className="mt-5 text-center text-sm text-danger">{error}</p>}
        <Button className="mt-7" disabled={opening} onClick={() => void handleOpenPdf()}>
          {opening ? 'PDF 여는 중...' : 'PDF로 책 열기'}
        </Button>
        <Button className="mt-2" variant="ghost" onClick={() => navigate('/library')}>내 서재로</Button>
      </main>
    </div>
  )
}
