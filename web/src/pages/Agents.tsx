import { useQuery } from '@tanstack/react-query'
import { agentApi } from '../services/api'
import StatusBadge from '../components/StatusBadge'

export default function Agents() {
  const { data, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentApi.getAll().then(res => res.data),
    refetchInterval: 5000,
  })

  const agents = data?.agents || []

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Agent 管理</h1>
        <p className="text-sm text-muted-foreground">查看和管理所有 Agent 状态</p>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {agents.filter((a: any) => a.status === 'idle').length}
              </p>
              <p className="text-sm text-muted-foreground">空闲</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {agents.filter((a: any) => a.status === 'busy').length}
              </p>
              <p className="text-sm text-muted-foreground">工作中</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {agents.filter((a: any) => a.status === 'offline').length}
              </p>
              <p className="text-sm text-muted-foreground">离线</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent 列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 bg-dark-card rounded-lg border border-dark-border animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-dark-bg rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-dark-bg rounded w-3/4 mb-2" />
                  <div className="h-3 bg-dark-bg rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent: any) => (
            <div
              key={agent.id}
              className="p-4 bg-dark-card rounded-lg border border-dark-border hover:border-primary-500/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {agent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{agent.id}</p>
                </div>
                <StatusBadge status={agent.status} size="sm" />
              </div>

              {agent.currentTask && (
                <div className="mt-3 pt-3 border-t border-dark-border">
                  <p className="text-xs text-muted-foreground mb-1">当前任务</p>
                  <p className="text-sm text-foreground truncate">{agent.currentTask}</p>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-dark-border">
                <p className="text-xs text-muted-foreground">
                  最后活跃：{new Date(agent.lastActive).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">暂无 Agent</h3>
          <p className="text-muted-foreground">等待 Agent 连接...</p>
        </div>
      )}
    </div>
  )
}
