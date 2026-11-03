import { NavLink } from 'react-router-dom'

type TabIconName = 'home' | 'library' | 'mypage'

const tabs = [
  { to: '/home', icon: 'home' as const, label: '홈' },
  { to: '/library', icon: 'library' as const, label: '서재' },
  { to: '/mypage', icon: 'mypage' as const, label: '마이' },
] as const

function TabIcon({ name }: { name: TabIconName }) {
  switch (name) {
    case 'home':
      return (
        <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
          />
        </svg>
      )
    case 'library':
      return (
        <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M5 4h4v16H5zM10 4h4v16h-4zM16 5l3-1 3 15-3 1z" />
        </svg>
      )
    case 'mypage':
      return (
        <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path fill="currentColor" d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
        </svg>
      )
  }
}

export function TabBar() {
  return (
    <nav
      aria-label="주요 메뉴"
      className="w-full px-4 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-2"
    >
      <div className="flex h-[58px] items-stretch rounded-full border border-border bg-surface-card/95 shadow-paper backdrop-blur-sm">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center justify-center gap-0.5 transition-opacity',
                isActive ? 'text-ink opacity-100' : 'text-ink opacity-35',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <TabIcon name={tab.icon} />
                <span
                  className={[
                    'text-[10px] tracking-wide',
                    isActive ? 'font-semibold' : 'font-medium',
                  ].join(' ')}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
