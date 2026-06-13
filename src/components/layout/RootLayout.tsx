import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Toast } from '@/components/common/Toast'
import { PaywallModal } from '@/components/features/paywall/PaywallModal'
import { NativeBridge } from '@/components/layout/NativeBridge'
import { useAuthStore } from '@/stores/authStore'

export function RootLayout() {
  const { initialized, initialize } = useAuthStore()

  useEffect(() => {
    if (!initialized) {
      void initialize()
    }
  }, [initialized, initialize])

  return (
    <div className="mx-auto min-h-dvh w-full max-w-phone bg-surface">
      <NativeBridge />
      <Outlet />
      <PaywallModal />
      <Toast />
    </div>
  )
}
