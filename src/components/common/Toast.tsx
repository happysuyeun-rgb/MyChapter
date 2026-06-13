import { useEffect } from 'react'
import { useToastStore } from '@/stores/toastStore'

export function Toast() {
  const { message, hideToast } = useToastStore()

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(hideToast, 3000)
    return () => clearTimeout(timer)
  }, [message, hideToast])

  if (!message) return null

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-24 left-1/2 z-[70] w-[calc(100%-2.5rem)] max-w-phone -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
    >
      {message}
    </div>
  )
}
