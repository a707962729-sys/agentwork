import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import Sidebar from './Sidebar'
import Header from './Header'
import { useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { darkMode } = useAppStore()
  const location = useLocation()

  // 根据路径获取页面标题
  const getPageTitle = (path: string) => {
    const titles: Record<string, string> = {
      '/': '仪表盘',
      '/tasks': '任务管理',
      '/skills': '技能管理',
      '/workflows': '工作流管理',
      '/agents': 'Agent 管理',
      '/chat': '对话界面',
      '/settings': '系统设置',
    }
    
    // 处理动态路由
    if (path.startsWith('/tasks/')) {
      return '任务详情'
    }
    
    return titles[path] || 'AgentWork'
  }

  // 初始化深色模式
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // 移动端路由切换时自动关闭侧边栏
  useEffect(() => {
    if (window.innerWidth < 1024) {
      useAppStore.getState().toggleSidebar()
    }
  }, [location])

  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="min-h-screen bg-dark-bg flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <Header title={pageTitle} />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
