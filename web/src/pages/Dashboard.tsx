import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi, employeeApi, marketWorkflowApi } from '../services/api'
import { useAppStore } from '../store/appStore'
import { Drawer } from '../components/Modal'

// Mock 数据已移除，使用真实 API 数据


const statusConfig = {
  working: { color: '#00B42A', label: '工作中', bgColor: '#00B42A15', live: true },
  idle: { color: '#86909C', label: '空闲', bgColor: '#86909C15', live: false },
  pending: { color: '#FF7D00', label: '待执行', bgColor: '#FF7D0015', live: false },
  error: { color: '#F53F3F', label: '异常', bgColor: '#F53F3F15', live: false },
}

const roleIcons: Record<string, string> = {
  '数据处理': '📊',
  '文案创作': '✍️',
  '客户跟进': '👥',
  '报表生成': '📈',
}

interface AgentType {
  id: string
  name: string
  avatar: string
  role: string
  employmentType: string
  status: 'working' | 'idle' | 'pending' | 'error'
  currentTask: string
  progress: number
  workflowId: string | null
  workflowName: string | null
  workflowSource: 'official' | 'developer' | null
  workflowStep: number
  workflowTotalSteps: number
  skills: { name: string; type: string }[]
}


interface GroupType {
  role: string
  agents: AgentType[]
  expanded: boolean
}

function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) {
  return (
    <div className="bg-[#1E2128] rounded-xl p-5 border border-dark-border">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <span className="text-lg" style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-[#86909C]">{title}</p>
    </div>
  )
}

// 状态进度条组件
function StatusProgressBar({ status, progress }: { status: 'working' | 'idle' | 'pending' | 'error'; progress: number }) {
  if (status === 'idle') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[#121418] rounded-full overflow-hidden">
          <div className="h-full bg-[#86909C]/30 rounded-full" style={{ width: '100%' }} />
        </div>
        <span className="text-xs text-[#86909C]">无任务</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[#121418] rounded-full overflow-hidden">
          <div className="h-full bg-[#F53F3F]/50 rounded-full" style={{ width: '100%' }} />
        </div>
        <span className="text-xs text-[#F53F3F]">异常</span>
      </div>
    )
  }

  const barColor = status === 'working' ? '#00B42A' : '#FF7D00'
  const displayProgress = status === 'pending' ? 20 : progress

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#121418] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full relative"
          style={{ width: `${displayProgress}%`, backgroundColor: barColor }}
        >
          {status === 'working' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
      <span className="text-xs" style={{ color: barColor }}>
        {status === 'pending' ? '待执行' : `${progress}%`}
      </span>
    </div>
  )
}

// 工作流标签组件
function WorkflowTag({ workflow }: { workflow: { name: string; source: 'official' | 'developer' } | null }) {
  if (!workflow) {
    return <span className="text-xs text-[#86909C]">未绑定工作流</span>
  }

  const sourceStyle = workflow.source === 'official'
    ? { bg: '#165DFF15', color: '#165DFF', borderColor: '#165DFF30' }
    : { bg: '#00B42A15', color: '#00B42A', borderColor: '#00B42A30' }

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-md"
      style={{
        backgroundColor: sourceStyle.bg,
        color: sourceStyle.color,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: sourceStyle.borderColor,
      }}
    >
      {workflow.source === 'official' ? '🏛️' : '🛠️'} {workflow.name}
    </span>
  )
}

// 工作流步骤进度
function WorkflowSteps({ step, total }: { step: number; total: number }) {
  if (total === 0) return null

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full ${
            i < step ? 'bg-[#165DFF]' : i === step ? 'bg-[#165DFF]/50 animate-pulse' : 'bg-[#121418]'
          }`}
        />
      ))}
      <span className="text-xs text-[#86909C] ml-1">{step}/{total}</span>
    </div>
  )
}

// 员工卡片（精简版）
function EmployeeMiniCard({ agent, onClick }: { agent: AgentType; onClick: () => void }) {
  const config = statusConfig[agent.status as keyof typeof statusConfig] || statusConfig.idle

  return (
    <div
      onClick={onClick}
      className="bg-[#121418] rounded-lg p-3 hover:bg-[#1E2128] transition-colors cursor-pointer border border-transparent hover:border-dark-border"
    >
      {/* 第一行：头像 + 名称 + 状态 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#165DFF]/80 to-[#165DFF]/40 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">{agent.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{agent.name}</p>
        </div>
        <span
          className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.label}
        </span>
      </div>

      {/* 第二行：进度条 */}
      <StatusProgressBar status={agent.status} progress={agent.progress} />

      {/* 第三行：工作流信息 */}
      <div className="mt-2 flex items-center gap-2">
        <WorkflowTag
          workflow={agent.workflowName ? { name: agent.workflowName, source: agent.workflowSource as 'official' | 'developer' } : null}
        />
      </div>

      {/* 工作流步骤进度 */}
      {agent.workflowTotalSteps > 0 && (
        <WorkflowSteps step={agent.workflowStep} total={agent.workflowTotalSteps} />
      )}
    </div>
  )
}

// 分组卡片
function GroupCard({ group, onToggle, onAgentClick }: {
  group: GroupType;
  onToggle: () => void;
  onAgentClick: (agent: AgentType) => void;
}) {
  const workingCount = group.agents.filter(a => a.status === 'working').length
  const onlineCount = group.agents.filter(a => a.status !== 'idle' && a.status !== 'error').length

  return (
    <div className="bg-[#1E2128] rounded-xl border border-dark-border overflow-hidden">
      {/* 分组标题 */}
      <div
        onClick={onToggle}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
      >
        {/* 展开/折叠箭头 */}
        <span className={`text-[#86909C] transition-transform ${group.expanded ? 'rotate-90' : ''}`}>
          ▶
        </span>

        {/* 小组图标 */}
        <span className="text-lg">{roleIcons[group.role] || '📋'}</span>

        {/* 小组名称 */}
        <span className="font-medium text-white">{group.role}</span>

        {/* 人数 */}
        <span className="text-xs text-[#86909C]">({group.agents.length}人)</span>

        {/* 在线/工作中状态统计 */}
        <div className="flex items-center gap-2 ml-auto">
          {workingCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-[#00B42A]/10 text-[#00B42A]">
              {workingCount}工作中
            </span>
          )}
          {onlineCount > 0 && onlineCount !== workingCount && (
            <span className="text-xs px-2 py-0.5 rounded bg-[#FF7D00]/10 text-[#FF7D00]">
              {onlineCount}在线
            </span>
          )}
        </div>
      </div>

      {/* 组成员 */}
      {group.expanded && (
        <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {group.agents.map(agent => (
            <EmployeeMiniCard
              key={agent.id}
              agent={agent}
              onClick={() => onAgentClick(agent)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 员工详情抽屉
function EmployeeDetailDrawer({ agent, isOpen, onClose }: { agent: AgentType | null; isOpen: boolean; onClose: () => void }) {
  if (!agent) return null
  const config = statusConfig[agent.status as keyof typeof statusConfig] || statusConfig.idle

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="员工详情" width="lg">
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#165DFF] to-[#165DFF]/60 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">{agent.avatar}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-white">{agent.name}</h3>
              <span
                className="text-xs px-2 py-1 rounded-md"
                style={{ backgroundColor: config.bgColor, color: config.color }}
              >
                {config.label}
              </span>
            </div>
            <p className="text-sm text-[#86909C]">
              {agent.role} · {agent.employmentType}
            </p>
          </div>
        </div>

        {/* 当前任务 */}
        <div className="bg-[#121418] rounded-lg p-4">
          <p className="text-xs text-[#86909C] mb-2">当前任务</p>
          <p className="text-sm text-white">{agent.currentTask || '暂无进行中的任务'}</p>
          {agent.status === 'working' && agent.progress > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#86909C]">进度</span>
                <span className="text-white font-medium">{agent.progress}%</span>
              </div>
              <div className="h-2 bg-[#1E2128] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00B42A] rounded-full relative"
                  style={{ width: `${agent.progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 工作流信息 */}
        {agent.workflowName && (
          <div className="bg-[#121418] rounded-lg p-4">
            <p className="text-xs text-[#86909C] mb-2">当前工作流</p>
            <div className="flex items-center gap-2 mb-2">
              <WorkflowTag
                workflow={{ name: agent.workflowName, source: agent.workflowSource as 'official' | 'developer' }}
              />
            </div>
            {agent.workflowTotalSteps > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#86909C]">步骤进度</span>
                  <span className="text-white font-medium">{agent.workflowStep}/{agent.workflowTotalSteps}</span>
                </div>
                <div className="h-2 bg-[#1E2128] rounded-full overflow-hidden flex gap-1">
                  {Array.from({ length: agent.workflowTotalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full ${
                        i < agent.workflowStep ? 'bg-[#165DFF]' : 'bg-[#2A2D35]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 绑定的技能 */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3">绑定的技能</h4>
          <div className="flex flex-wrap gap-2">
            {agent.skills.map((skill, idx) => (
              <span
                key={idx}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{
                  backgroundColor: skill.type === 'official' ? '#165DFF15' : '#00B42A15',
                  color: skill.type === 'official' ? '#165DFF' : '#00B42A',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: skill.type === 'official' ? '#165DFF30' : '#00B42A30',
                }}
              >
                {skill.name}
              </span>
            ))}
            {agent.skills.length === 0 && (
              <p className="text-sm text-[#86909C]">暂无绑定技能</p>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4 border-t border-dark-border">
          <button className="flex-1 px-4 py-2.5 bg-[#165DFF]/10 text-[#165DFF] rounded-lg hover:bg-[#165DFF]/20 transition-colors text-sm font-medium">
            分配任务
          </button>
          <button
            onClick={() => { window.location.href = `/config?edit=${agent.id}` }}
            className="flex-1 px-4 py-2.5 bg-[#FF7D00]/10 text-[#FF7D00] rounded-lg hover:bg-[#FF7D00]/20 transition-colors text-sm font-medium"
          >
            编辑配置
          </button>
          <button
            onClick={() => { window.location.href = `/assets?employee=${agent.id}` }}
            className="flex-1 px-4 py-2.5 bg-[#00B42A]/10 text-[#00B42A] rounded-lg hover:bg-[#00B42A]/20 transition-colors text-sm font-medium"
          >
            查看成果
          </button>
        </div>
      </div>
    </Drawer>
  )
}

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { addNotification } = useAppStore()

  // 获取 Dashboard 统计数据
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then(res => res.data).catch(() => null),
  })

  // 获取员工列表
  const { data: employeesData, refetch: refetchEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.getAll().then(res => res.data).catch(() => null),
  })

  // 获取市场工作流详情 (预留，供后续使用)
  useQuery({
    queryKey: ['workflows-market'],
    queryFn: () => marketWorkflowApi.getAll().then(res => res.data).catch(() => null),
  })

  const stats = statsData
  const employeesTotal = employeesData?.employees?.length ?? 0
  const employeesWorking = employeesData?.employees?.filter((e: any) => e.status === 'working').length ?? 0
  const agents: AgentType[] = (employeesData?.employees || []).map((e: any) => ({
    id: e.id,
    name: e.name,
    avatar: e.name?.slice(0, 1) || '?',
    role: e.role || 'general',
    employmentType: e.employmentType || e.concurrent_limit === 1 ? 'full' : 'part',
    status: e.status || 'idle',
    currentTask: e.system_prompt ? '已配置' : '待设置',
    progress: 0,
    workflowId: null,
    workflowName: null,
    workflowSource: null,
    workflowStep: 0,
    workflowTotalSteps: 0,
    skills: (() => { try { const arr = typeof e.skills === 'string' ? JSON.parse(e.skills) : (e.skills || []); return Array.isArray(arr) ? arr.map((s: string) => ({ name: s, type: 'official' as const })) : []; } catch { return []; } })(),
  }))

  // 按岗位分组
  const groupedAgents = useMemo(() => {
    const groups: Record<string, AgentType[]> = {}
    agents.forEach(agent => {
      if (!groups[agent.role]) {
        groups[agent.role] = []
      }
      groups[agent.role].push(agent)
    })

    return Object.entries(groups).map(([role, roleAgents]) => ({
      role,
      agents: roleAgents.sort((a, b) => {
        const order = { working: 0, pending: 1, idle: 2, error: 3 }
        return order[a.status] - order[b.status]
      }),
      expanded: expandedGroups[role] !== undefined ? expandedGroups[role] : true,
    }))
  }, [agents, expandedGroups])

  // 统计汇总
  const summaryStats = useMemo(() => {
    const total = employeesData?.employees?.length ?? 0
    const online = agents.filter(a => a.status !== 'idle' && a.status !== 'error').length
    const working = agents.filter(a => a.status === 'working').length
    return { total, online, working }
  }, [agents])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchStats(), refetchEmployees()])
      addNotification({
        type: 'success',
        title: '刷新成功',
        message: '数据已更新',
        timestamp: new Date().toISOString(),
      })
    } catch {
      addNotification({
        type: 'error',
        title: '刷新失败',
        message: '无法获取最新数据，请检查网络连接',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setRefreshing(false)
    }
  }, [refetchStats, refetchEmployees, addNotification])

  const handleToggleGroup = (role: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [role]: !prev[role],
    }))
  }

  const handleAgentClick = (agent: AgentType) => {
    setSelectedAgent(agent)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="数字员工总数" value={employeesTotal} icon="👥" color="#165DFF" />
        <StatCard title="工作中" value={employeesWorking} icon="📋" color="#00B42A" />
        <StatCard title="任务总数" value={stats?.tasks?.total ?? 0} icon="📦" color="#FF7D00" />
        <StatCard title="工作流总数" value={stats?.workflows?.total ?? 0} icon="⚡" color="#165DFF" />
      </div>

      {/* 全员实时状态 - 分组树状图 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">全员实时状态</h2>
          <div className="flex items-center gap-4">
            {/* 汇总统计 */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-[#86909C]">
                总计: <span className="text-white font-medium">{summaryStats.total}</span>
              </span>
              <span className="text-[#86909C]">
                在线: <span className="text-[#FF7D00] font-medium">{summaryStats.online}</span>
              </span>
              <span className="text-[#86909C]">
                工作中: <span className="text-[#00B42A] font-medium">{summaryStats.working}</span>
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 text-sm text-[#86909C] hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </button>
          </div>
        </div>

        {/* 分组列表 */}
        <div className="space-y-3">
          {groupedAgents.map(group => (
            <GroupCard
              key={group.role}
              group={group}
              onToggle={() => handleToggleGroup(group.role)}
              onAgentClick={handleAgentClick}
            />
          ))}
        </div>
      </div>

      {/* 员工详情抽屉 */}
      <EmployeeDetailDrawer
        agent={selectedAgent}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedAgent(null)
        }}
      />
    </div>
  )
}
