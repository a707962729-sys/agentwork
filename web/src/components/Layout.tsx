import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Toast from './Toast'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const getPageTitle = (path: string) => {
    const titles: Record<string, string> = {
      '/': '总览控制台',
      '/agents': '数字员工团队',
      '/assets': '工作成果资产库',
      '/skills': '技能与工作流市场',
      '/config': '员工配置演示',
      '/chat': '对话界面',
      '/channels': '渠道配置',
      '/models': '模型配置',
      '/models/routing': '模型路由',
    }
    return titles[path] || 'OneAgent'
  }

  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="min-h-screen bg-[#121418] flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-h-screen ml-[260px]">
        {/* 顶部 Header */}
        <header className="h-14 bg-[#1E2128] border-b border-dark-border flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-base font-bold text-white">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#86909C]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#00B42A] mr-1.5 animate-live"></span>
              系统正常
            </span>
          </div>
        </header>
        
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Toast 通知 */}
      <Toast />
    </div>
  )
}
