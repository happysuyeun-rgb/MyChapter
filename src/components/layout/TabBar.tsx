import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/home', icon: '🏠', label: '홈' },
  { to: '/records', icon: '📝', label: '기록' },
  { to: '/book', icon: '📖', label: '내 책' },
  { to: '/mypage', icon: '👤', label: '마이' },
] as const

export function TabBar() {
  return (
    <nav className="safe-bottom flex h-14 shrink-0 border-t border-border bg-white">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            [
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2',
              isActive ? 'text-accent' : 'text-ink-faint',
            ].join(' ')
          }
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span className="text-[10px] font-medium">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
