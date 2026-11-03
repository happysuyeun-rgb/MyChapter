import { NavLink } from 'react-router-dom'

type TabIconName = 'home' | 'library' | 'mypage'

const tabs = [
  { to: '/home', icon: 'home' as const, label: '홈' },
  { to: '/library', icon: 'library' as const, label: '서재' },
  { to: '/mypage', icon: 'mypage' as const, label: '마이' },
] as const

function TabIcon({ name, active }: { name: TabIconName; active: boolean }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 2 : 1.75,
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
    case 'library':
      return (
        <svg {...props}>
          <path d="M5 4h4v16H5zM10 4h4v16h-4zM16 5l3-1 3 15-3 1z" />
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
    <nav
      aria-label="주요 메뉴"
      className="safe-bottom flex h-[62px] shrink-0 border-t border-ink/15 bg-[#EFE6D8]/95 backdrop-blur-sm"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            [
              'relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
              isActive ? 'text-ink' : 'text-ink-faint',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 h-[3px] w-8 bg-ink" aria-hidden />
              )}
              <TabIcon name={tab.icon} active={isActive} />
              <span className={['text-[10px] tracking-wide', isActive ? 'font-semibold' : 'font-medium'].join(' ')}>
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
