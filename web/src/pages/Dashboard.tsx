import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { systemApi, taskApi, agentApi } from '../services/api'
import TaskCard from '../components/TaskCard'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  // 获取系统状态
  const { data: stats } = useQuery({
    queryKey: ['system-stats'],
    queryFn: () => systemApi.getStats().then(res => res.data),
    refetchInterval: 10000,
  })

  // 获取最近任务
  const { data: recentTasks } = useQuery({
    queryKey: ['recent-tasks'],
    queryFn: () => taskApi.getAll({ limit: 5 }).then(res => res.data),
    refetchInterval: 5000,
  })

  // 获取 Agent 状态
  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentApi.getAll().then(res => res.data),
    refetchInterval: 5000,
  })

  const statsData = stats?.stats || {}
  const tasksData = recentTasks?.tasks || []

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">今日任务</h3>
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-foreground">{statsData.todayTasks || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">较昨日 +{statsData.todayTasksGrowth || 0}%</p>
        </div>

        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">进行中</h3>
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-foreground">{statsData.runningTasks || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">总计 {statsData.totalTasks || 0} 个任务</p>
        </div>

        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">活跃 Agent</h3>
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-foreground">{statsData.activeAgents || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">共 {agentsData?.agents?.length || 0} 个 Agent</p>
        </div>

        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">成功率</h3>
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-foreground">{statsData.successRate || 0}%</p>
          <p className="text-xs text-muted-foreground mt-1">最近 7 天</p>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/chat"
          className="p-4 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-lg border border-primary-500/30 hover:border-primary-500/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">新建对话</h3>
              <p className="text-sm text-muted-foreground">与 Coordinator 对话</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/tasks"
          className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">创建任务</h3>
              <p className="text-sm text-muted-foreground">手动创建新任务</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/workflows"
          className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg border border-green-500/30 hover:border-green-500/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">执行工作流</h3>
              <p className="text-sm text-muted-foreground">运行自动化流程</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 最近任务 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">最近任务</h2>
          <Link to="/tasks" className="text-sm text-primary-400 hover:text-primary-300">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasksData.slice(0, 3).map((task: any) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>

      {/* Agent 状态 */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Agent 状态</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentsData?.agents?.slice(0, 6).map((agent: any) => (
            <div key={agent.id} className="p-4 bg-dark-card rounded-lg border border-dark-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {agent.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">{agent.id}</p>
                  </div>
                </div>
                <StatusBadge status={agent.status} size="sm" />
              </div>
              {agent.currentTask && (
                <div className="text-xs text-muted-foreground">
                  当前任务：{agent.currentTask}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
