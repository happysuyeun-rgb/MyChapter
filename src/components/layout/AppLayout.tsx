import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'

export function AppLayout() {
  return (
    <div className="mx-auto flex h-full min-h-dvh w-full max-w-phone flex-col bg-white">
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
