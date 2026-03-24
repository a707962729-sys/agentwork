import TaskTrendChart from './TaskTrendChart'
import TaskDistributionChart from './TaskDistributionChart'
import AgentActivityChart from './AgentActivityChart'
import Timeline from './Timeline'
import StatCard from './StatCard'
import StatusBadge from './StatusBadge'

interface DashboardStats {
  todayTasks: number
  runningTasks: number
  completedTasks: number
  failedTasks: number
  successRate: number
  activeAgents: number
  totalAgents: number
  systemUptime: string
  todayOutputs: number
}

interface DashboardData {
  stats: DashboardStats
  recentTasks: Array<{
    id: string
    title: string
    status: string
    createdAt: string
    steps?: any[]
  }>
  taskTrend: Array<{ date: string; count: number }>
  taskDistribution: Array<{ name: string; value: number }>
  agentActivity: Array<{ name: string; value: number }>
  timelineEvents: Array<{
    id: string
    title: string
    time: string
    status: string
    description?: string
    type?: 'task' | 'decision' | 'system'
  }>
}

interface DashboardProps {
  data: DashboardData
}

export default function Dashboard({ data }: DashboardProps) {
  const { stats, recentTasks, taskTrend, taskDistribution, agentActivity, timelineEvents } = data

  const recentTasksWithoutSteps = recentTasks.map(task => ({
    ...task,
    steps: task.steps?.map(step => ({
      id: step.id,
      name: step.name,
      status: step.status,
    })),
  }))

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="任务总数"
          value={stats.todayTasks}
          trend="12%"
          trendUp={true}
          description="今日任务总数"
          icon={
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />

        <StatCard
          title="进行中"
          value={stats.runningTasks}
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          description="当前正在执行的任务"
        />

        <StatCard
          title="成功率"
          value={`${stats.successRate}%`}
          trend="3.2%"
          trendUp={true}
          icon={
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          description="最近 7 天成功率"
        />

        <StatCard
          title="活跃 Agent"
          value={stats.activeAgents}
          description={`${stats.totalAgents} 个已注册`}
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskTrendChart data={taskTrend} title="任务趋势（最近 7 天）" />
        <TaskDistributionChart data={taskDistribution} title="任务分布（按类型）" />
        <div className="lg:col-span-2">
          <AgentActivityChart data={agentActivity} title="Agent 活跃度" />
        </div>
      </div>

      {/* 时间线 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Timeline events={timelineEvents} title="今日时间线" />
        </div>
        
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">待决策事项</h3>
          <div className="space-y-3">
            {timelineEvents.filter(e => e.type === 'decision').length > 0 ? (
              timelineEvents
                .filter(e => e.type === 'decision')
                .slice(0, 5)
                .map((event) => (
                  <div key={event.id} className="p-3 bg-dark-bg rounded-lg border border-purple-500/30">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">{event.title}</h4>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <StatusBadge status="pending" size="sm" />
                          <span className="text-xs text-muted-foreground">{event.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无待决策事项
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 最近任务 */}
      <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">最近任务</h3>
        </div>
        
        {recentTasksWithoutSteps.length > 0 ? (
          <div className="space-y-3">
            {recentTasksWithoutSteps.slice(0, 5).map((task: any) => (
              <div
                key={task.id}
                className="p-3 bg-dark-bg rounded-lg border border-dark-border hover:border-primary-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{task.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            暂无任务记录
          </div>
        )}
      </div>
    </div>
  )
}
