import { NavBar } from '@/components/layout/NavBar'

interface LegalPageProps {
  title: string
  url: string
}

export function LegalPage({ title, url }: LegalPageProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
      <NavBar title={title} leftLabel="←" />
      <iframe title={title} src={url} className="h-[calc(100dvh-56px)] w-full border-0 bg-surface" />
    </div>
  )
}
