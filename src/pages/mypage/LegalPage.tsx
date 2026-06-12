import { NavBar } from '@/components/layout/NavBar'

interface LegalPageProps {
  title: string
  url: string
}

export function LegalPage({ title, url }: LegalPageProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-white">
      <NavBar title={title} leftLabel="←" />
      <iframe
        title={title}
        src={url}
        className="h-[calc(100dvh-52px)] w-full border-0"
      />
    </div>
  )
}
