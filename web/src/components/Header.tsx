import { useAppStore } from '../store/appStore'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const { toggleDarkMode, darkMode, toggleSidebar, notifications, removeNotification } = useAppStore()

  return (
    <header className="h-14 bg-dark-card/80 backdrop-blur-xl border-b border-dark-border flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-dark-bg rounded-xl transition-colors lg:hidden"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* 通知 */}
        <div className="relative">
          <button className="p-2 hover:bg-dark-bg rounded-xl transition-colors relative">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          {/* 通知下拉 */}
          {notifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-80 bg-dark-card/95 backdrop-blur-xl border border-dark-border rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-dark-border/50">
                <h3 className="font-semibold text-foreground text-sm">通知</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border-b border-dark-border/50 hover:bg-dark-bg/50 cursor-pointer transition-colors"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        notification.type === 'success' ? 'bg-emerald-500' :
                        notification.type === 'error' ? 'bg-rose-500' :
                        notification.type === 'warning' ? 'bg-amber-500' :
                        'bg-cyan-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{notification.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 深色模式切换 */}
        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-dark-bg rounded-xl transition-colors"
        >
          {darkMode ? (
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
