import type { ReactNode } from 'react'
import brandCi from '@/assets/images/brand/ci.png'

interface BrandMastheadProps {
  /** Optional left control (e.g. back). Logo stays visible beside or after it. */
  left?: ReactNode
  /** Optional right control (알림, 설정 등) */
  right?: ReactNode
  className?: string
}

/** Shared MY CHAPTER logo row used on tab + detail headers. */
export function BrandMasthead({ left, right, className = '' }: BrandMastheadProps) {
  return (
    <div
      className={[
        'flex h-11 w-full items-center justify-between gap-3',
        className,
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-2">
        {left}
        <img
          src={brandCi}
          alt="MY CHAPTER"
          className="h-7 w-auto max-w-[180px] object-contain object-left"
          decoding="async"
        />
      </div>
      {right ? <div className="flex shrink-0 items-center">{right}</div> : <span className="w-11 shrink-0" aria-hidden />}
    </div>
  )
}
