import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'

/** Bottom reserve for floating pill tab + safe-area */
const TAB_DOCK_SPACE = 'pb-[calc(5.5rem+20px+env(safe-area-inset-bottom,0px))]'

export function AppLayout() {
  return (
    <div className="relative mx-auto flex h-dvh min-h-dvh w-full max-w-phone flex-col overflow-hidden bg-surface">
      <main className={`flex min-h-0 flex-1 flex-col overflow-hidden ${TAB_DOCK_SPACE}`}>
        <Outlet />
      </main>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
        <div className="pointer-events-auto">
          <TabBar />
        </div>
      </div>
    </div>
  )
}
