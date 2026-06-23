import { NavLink } from 'react-router-dom'

type TabIconName = 'home' | 'records' | 'book' | 'mypage'

const tabs = [
  { to: '/home', icon: 'home' as const, label: '홈' },
  { to: '/records', icon: 'records' as const, label: '기록' },
  { to: '/book', icon: 'book' as const, label: '내 책' },
  { to: '/mypage', icon: 'mypage' as const, label: '마이' },
] as const

function TabIcon({ name }: { name: TabIconName }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'home':
      return (
        <svg {...props}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      )
    case 'records':
      return (
        <svg {...props}>
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
          <path d="M14 3v6h6M8 13h8M8 17h5" />
        </svg>
      )
    case 'book':
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      )
    case 'mypage':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
        </svg>
      )
  }
}

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
          <TabIcon name={tab.icon} />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
