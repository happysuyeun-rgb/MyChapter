import { Outlet } from 'react-router-dom'
import { PaywallModal } from '@/components/features/paywall/PaywallModal'
import { NativeBridge } from '@/components/layout/NativeBridge'

export function RootLayout() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-phone bg-surface">
      <NativeBridge />
      <Outlet />
      <PaywallModal />
    </div>
  )
}
