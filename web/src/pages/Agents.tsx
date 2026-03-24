// 数字员工团队页面

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeApi } from '../services/api'
import { useAppStore } from '../store/appStore'
import { Drawer } from '../components/Modal'

// Mock 数据
const mockAgents = [
  {
    id: 'agent-d1',
    name: '小智',
    avatar: '智',
    role: '数据处理',
    employmentType: '全职',
    status: 'working' as const,
    currentTask: '处理 Q1 销售数据分析',
    progress: 68,
    skills: [
      { id: 'sk1', name: '数据采集', type: 'official' },
      { id: 'sk2', name: 'Excel处理', type: 'official' },
      { id: 'sk3', name: '行业报告生成', type: 'developer' },
    ],
    workflows: [
      { id: 'wf1', name: '数据采集分析流程' },
    ],
    outputs: 128,
  },
  {
    id: 'agent-d2',
    name: '数据宝',
    avatar: '宝',
    role: '数据处理',
    employmentType: '兼职',
    status: 'idle' as const,
    currentTask: '待命',
    progress: 0,
    skills: [
      { id: 'sk1', name: '数据采集', type: 'official' },
      { id: 'sk4', name: '报表生成', type: 'official' },
    ],
    workflows: [],
    outputs: 45,
  },
  {
    id: 'agent-c1',
    name: '小文',
    avatar: '文',
    role: '文案创作',
    employmentType: '全职',
    status: 'working' as const,
    currentTask: '撰写产品营销文案',
    progress: 45,
    skills: [
      { id: 'sk5', name: '文案写作', type: 'official' },
      { id: 'sk6', name: 'SEO优化', type: 'official' },
    ],
    workflows: [
      { id: 'wf2', name: '内容创作发布流程' },
    ],
    outputs: 89,
  },
  {
    id: 'agent-c2',
    name: '创意星',
    avatar: '创',
    role: '文案创作',
    employmentType: '全职',
    status: 'pending' as const,
    currentTask: '等待生成品牌文案',
    progress: 0,
    skills: [
      { id: 'sk5', name: '文案写作', type: 'official' },
      { id: 'sk6', name: 'SEO优化', type: 'official' },
      { id: 'sk7', name: 'BI可视化', type: 'developer' },
    ],
    workflows: [],
    outputs: 156,
  },
  {
    id: 'agent-k1',
    name: '小客',
    avatar: '客',
    role: '客户跟进',
    employmentType: '全职',
    status: 'idle' as const,
    currentTask: '待命',
    progress: 0,
    skills: [
      { id: 'sk8', name: 'CRM集成', type: 'official' },
      { id: 'sk9', name: '邮件发送', type: 'official' },
    ],
    workflows: [
      { id: 'wf3', name: '客户全生命周期管理' },
    ],
    outputs: 234,
  },
  {
    id: 'agent-k2',
    name: '客情通',
    avatar: '通',
    role: '客户跟进',
    employmentType: '兼职',
    status: 'working' as const,
    currentTask: '跟进重点客户',
    progress: 30,
    skills: [
      { id: 'sk8', name: 'CRM集成', type: 'official' },
    ],
    workflows: [],
    outputs: 67,
  },
  {
    id: 'agent-r1',
    name: '小报',
    avatar: '报',
    role: '报表生成',
    employmentType: '全职',
    status: 'working' as const,
    currentTask: '生成月度销售报表',
    progress: 85,
    skills: [
      { id: 'sk10', name: '报表生成', type: 'official' },
      { id: 'sk11', name: 'BI可视化', type: 'developer' },
    ],
    workflows: [
      { id: 'wf4', name: '金融行业报告工作流' },
    ],
    outputs: 98,
  },
  {
    id: 'agent-r2',
    name: '报表通',
    avatar: '通',
    role: '报表生成',
    employmentType: '兼职',
    status: 'idle' as const,
    currentTask: '待命',
    progress: 0,
    skills: [
      { id: 'sk10', name: '报表生成', type: 'official' },
      { id: 'sk2', name: 'Excel处理', type: 'official' },
    ],
    workflows: [],
    outputs: 52,
  },
]

const statusConfig = {
  working: { color: '#00B42A', label: '工作中' },
  idle: { color: '#86909C', label: '空闲' },
  pending: { color: '#FF7D00', label: '等待中' },
  error: { color: '#F53F3F', label: '异常' },
}

// API role 英文值 → 中文显示名
const roleLabelMap: Record<string, string> = {
  data_processor: '数据处理',
  writer: '文案创作',
  customer_service: '客户跟进',
  reporter: '报表生成',
  developer: '开发',
  designer: '设计',
  tester: '测试',
  devops: '运维',
}

function getRoleLabel(role: string): string {
  return roleLabelMap[role] || role
}

const employmentTypes = ['全部', '全职', '兼职', '手动触发']

interface Agent {
  id: string
  name: string
  avatar: string
  role: string
  employmentType: string
  status: 'working' | 'idle' | 'pending' | 'error'
  currentTask?: string
  progress?: number
  skills: { id: string; name: string; type: string }[]
  workflows: { id: string; name: string }[]
  outputs: number
}

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const config = statusConfig[agent.status] || statusConfig.idle

  return (
    <div
      onClick={onClick}
      className="bg-[#1E2128] rounded-xl p-5 border border-dark-border hover:border-[#165DFF]/30 transition-colors cursor-pointer"
    >
      {/* 头像和名称 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#165DFF] to-[#165DFF]/60 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">{agent.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate">{agent.name}</h3>
          <p className="text-xs text-[#86909C]">{agent.role}</p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-md flex-shrink-0"
          style={{ backgroundColor: `${config.color}15`, color: config.color }}
        >
          {config.label}
        </span>
      </div>

      {/* 进度条（工作中时显示） */}
      {agent.status === 'working' && agent.progress !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#86909C]">任务进度</span>
            <span className="text-white font-medium">{agent.progress}%</span>
          </div>
          <div className="h-1.5 bg-[#121418] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00B42A] rounded-full"
              style={{ width: `${agent.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 详细信息 */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[#86909C]">用工模式</span>
          <span className="text-white">{agent.employmentType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#86909C]">能力配置</span>
          <span className="text-white">{agent.skills.length} 项技能</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#86909C]">工作归属</span>
          <span className="text-[#165DFF] font-medium">{agent.outputs} 项产出</span>
        </div>
      </div>
    </div>
  )
}

function AgentDetailDrawer({ agent, isOpen, onClose }: { agent: Agent | null; isOpen: boolean; onClose: () => void }) {
  const { addNotification } = useAppStore()
  const queryClient = useQueryClient()
  const config = agent ? (statusConfig[agent.status as keyof typeof statusConfig] || statusConfig.idle) : null

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: '删除成功',
        message: `员工 ${agent?.name} 已删除`,
        timestamp: new Date().toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      onClose()
    },
    onError: () => {
      addNotification({
        type: 'error',
        title: '删除失败',
        message: '无法删除该员工，请稍后重试',
        timestamp: new Date().toISOString(),
      })
    },
  })

  if (!agent || !config) return null

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
                style={{ backgroundColor: `${config.color}15`, color: config.color }}
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
          {agent.status === 'working' && agent.progress !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#86909C]">进度</span>
                <span className="text-white font-medium">{agent.progress}%</span>
              </div>
              <div className="h-2 bg-[#1E2128] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00B42A] rounded-full transition-all"
                  style={{ width: `${agent.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 绑定的技能 */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3">绑定的技能</h4>
          <div className="flex flex-wrap gap-2">
            {agent.skills.map((skill) => (
              <span
                key={skill.id}
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

        {/* 绑定的工作流 */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3">绑定的工作流</h4>
          <div className="space-y-2">
            {agent.workflows.map((wf) => (
              <div key={wf.id} className="bg-[#121418] rounded-lg px-4 py-2 text-sm text-white">
                {wf.name}
              </div>
            ))}
            {agent.workflows.length === 0 && (
              <p className="text-sm text-[#86909C]">暂无绑定工作流</p>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4 border-t border-dark-border">
          <button className="flex-1 px-4 py-2.5 bg-[#165DFF]/10 text-[#165DFF] rounded-lg hover:bg-[#165DFF]/20 transition-colors text-sm font-medium">
            分配任务
          </button>
          <button
            onClick={() => {
              // 跳转到配置页面编辑
              window.location.href = `/config?edit=${agent.id}`
            }}
            className="flex-1 px-4 py-2.5 bg-[#FF7D00]/10 text-[#FF7D00] rounded-lg hover:bg-[#FF7D00]/20 transition-colors text-sm font-medium"
          >
            编辑配置
          </button>
          <button
            onClick={() => {
              // 跳转到成果页面
              window.location.href = `/assets?employee=${agent.id}`
            }}
            className="flex-1 px-4 py-2.5 bg-[#00B42A]/10 text-[#00B42A] rounded-lg hover:bg-[#00B42A]/20 transition-colors text-sm font-medium"
          >
            查看成果
          </button>
        </div>

        {/* 删除按钮 */}
        <button
          onClick={() => {
            if (confirm(`确定要删除员工 ${agent.name} 吗？此操作不可恢复。`)) {
              deleteMutation.mutate(agent.id)
            }
          }}
          disabled={deleteMutation.isPending}
          className="w-full px-4 py-2.5 bg-[#F53F3F]/10 text-[#F53F3F] rounded-lg hover:bg-[#F53F3F]/20 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {deleteMutation.isPending ? '删除中...' : '删除员工'}
        </button>
      </div>
    </Drawer>
  )
}

export default function Agents() {
  const [selectedRole, setSelectedRole] = useState('全部')
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('全部')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 获取员工列表
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.getAll().then(res => res.data).catch(() => null),
  })

  // 使用 API 数据或 fallback 到 mock
  const allAgents: Agent[] = employeesData?.employees || mockAgents

  // 从真实数据提取所有不重复的角色（用于动态生成 tabs）
  const availableRoles = useMemo(() => {
    const seen = new Set<string>()
    for (const a of allAgents) {
      seen.add(a.role)
    }
    return ['全部', ...Array.from(seen).sort()]
  }, [allAgents])

  // 筛选后的员工列表
  const filteredAgents = useMemo(() => {
    return allAgents.filter(agent => {
      // 岗位筛选（selectedRole 存的是原始英文 role 值，'全部' 也兼容）
      if (selectedRole !== '全部' && agent.role !== selectedRole) {
        return false
      }
      // 用工模式筛选
      if (selectedEmploymentType !== '全部' && agent.employmentType !== selectedEmploymentType) {
        return false
      }
      // 搜索筛选
      if (searchKeyword && !agent.name.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false
      }
      return true
    })
  }, [allAgents, selectedRole, selectedEmploymentType, searchKeyword])

  // 按角色分组，组内排序：working > pending > idle > error
  const groupedAgents = useMemo(() => {
    const statusOrder: Record<string, number> = { working: 0, pending: 1, idle: 2, error: 3 }
    const groups: Record<string, Agent[]> = {}
    for (const agent of filteredAgents) {
      const label = getRoleLabel(agent.role)
      if (!groups[label]) groups[label] = []
      groups[label].push(agent)
    }
    // 每组内排序
    for (const label of Object.keys(groups)) {
      groups[label].sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99))
    }
    // 返回有序数组
    return Object.keys(groups).sort().map(label => ({ label, agents: groups[label] }))
  }, [filteredAgents])

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold text-white">数字员工团队</h1>
        <p className="text-sm text-[#86909C] mt-1">管理您的数字员工队伍</p>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="搜索员工名称..."
          className="w-full px-4 py-2.5 pl-10 bg-[#1E2128] border border-dark-border rounded-lg text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF] transition-colors"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86909C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* 岗位分类筛选（动态生成，与 API 角色值对齐） */}
      <div className="flex flex-wrap gap-2">
        {availableRoles.map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              selectedRole === role
                ? 'bg-[#165DFF] text-white'
                : 'bg-[#1E2128] text-[#86909C] hover:text-white border border-dark-border'
            }`}
          >
            {role === '全部' ? '全部' : getRoleLabel(role)}
          </button>
        ))}
      </div>

      {/* 用工模式筛选 */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-[#86909C] self-center mr-2">用工模式:</span>
        {employmentTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedEmploymentType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              selectedEmploymentType === type
                ? 'bg-[#00B42A] text-white'
                : 'bg-[#1E2128] text-[#86909C] hover:text-white border border-dark-border'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <svg className="w-6 h-6 animate-spin text-[#165DFF]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="ml-3 text-[#86909C]">加载中...</span>
        </div>
      )}

      {/* 员工分组列表 */}
      {!isLoading && (
        <>
          {groupedAgents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#86909C]">没有找到匹配的员工</p>
            </div>
          )}
          {groupedAgents.map(({ label, agents }) => (
            <div key={label} className="mb-8">
              {/* 分组标题 */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-base font-semibold text-white">{label}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#165DFF]/20 text-[#165DFF]">
                  {agents.length} 人
                </span>
                {/* 分组内状态小计 */}
                {agents.some(a => a.status === 'working') && (
                  <span className="text-xs text-[#00B42A]">● {agents.filter(a => a.status === 'working').length} 工作中</span>
                )}
                {agents.some(a => a.status === 'pending') && (
                  <span className="text-xs text-[#FF7D00]">● {agents.filter(a => a.status === 'pending').length} 等待</span>
                )}
                {agents.every(a => a.status === 'idle') && (
                  <span className="text-xs text-[#86909C]">● 全部空闲</span>
                )}
              </div>
              {/* 分组内员工 grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} onClick={() => handleAgentClick(agent)} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* 员工详情抽屉 */}
      <AgentDetailDrawer
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
