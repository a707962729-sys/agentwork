import { useState, useEffect } from 'react'
import StatusBadge from '../components/StatusBadge'

interface TeamMember {
  name: string
  role: string
}

interface Team {
  id: string
  name: string
  description: string
  members: TeamMember[]
  enabled: boolean
}

const STORAGE_KEY = 'agentwork-teams-enabled'

// 中文团队名称映射
const TEAM_NAME_MAP: Record<string, { name: string; description: string; members: TeamMember[] }> = {
  'design-team': {
    name: '设计团队',
    description: '整合 UI/UX 设计、品牌管理、视觉叙事等设计相关技能。触发词：设计团队、design team、UI设计、UX、视觉设计。',
    members: [
      { name: 'UI设计专家', role: '界面设计' },
      { name: 'UX研究员', role: '用户体验' },
      { name: '品牌设计师', role: '视觉 Identity' },
    ],
  },
  'dev-team': {
    name: '开发团队',
    description: '整合架构设计、前后端开发、移动端、DevOps、AI集成的全栈工程能力。触发词：开发团队、工程团队、写代码、后端开发、前端开发、DevOps。',
    members: [
      { name: '架构师', role: '系统架构设计' },
      { name: '前端工程师', role: 'React/Vue 开发' },
      { name: '后端工程师', role: 'Node/Python/Go' },
      { name: 'DevOps工程师', role: 'CI/CD 流水线' },
    ],
  },
  'media-team': {
    name: '媒体团队',
    description: '整合内容创作、社交媒体运营、TikTok/Instagram/Reddit/Twitter 多平台增长策略。触发词：内容创作、社媒运营、增长黑客、社交媒体。',
    members: [
      { name: '内容创作者', role: '文案与创意' },
      { name: '社媒运营', role: '平台增长' },
      { name: '视频制作', role: '短视频剪辑' },
    ],
  },
  'ops-team': {
    name: '运营团队',
    description: '整合项目管理（实验跟踪、项目协调、运营管理、工作室制作）和行政支持（财务、法务、数据、基础设施）能力。触发词：项目管理、运营管理、行政支持、财务跟踪、法务合规。',
    members: [
      { name: '项目经理', role: '进度协调' },
      { name: '财务专员', role: '预算管理' },
      { name: '法务顾问', role: '合规审查' },
    ],
  },
  'product-team': {
    name: '产品团队',
    description: '整合用户反馈综合、产品迭代优先级排序、行业趋势研究三大能力。触发词：产品经理、产品规划、用户反馈、需求优先级、趋势研究。',
    members: [
      { name: '产品经理', role: '需求分析' },
      { name: '数据分析师', role: '用户洞察' },
      { name: '市场研究员', role: '行业趋势' },
    ],
  },
  'qa-testing': {
    name: '测试团队',
    description: '整合黑盒测试、API测试、性能测试、安全测试、E2E自动化、质量分析等全栈测试能力。触发词：测试、QA、质量保证、黑盒测试、自动化测试、性能测试。',
    members: [
      { name: '测试工程师', role: '功能测试' },
      { name: '自动化测试', role: 'E2E 脚本' },
      { name: '性能测试', role: '压力测试' },
    ],
  },
  'spatial-team': {
    name: '空间计算团队',
    description: '整合 visionOS、XR沉浸式开发、空间界面设计、Metal引擎、终端集成等空间计算全栈能力。触发词：visionOS、XR、空间计算、AR/VR、Apple Vision Pro。',
    members: [
      { name: 'XR开发者', role: '沉浸式体验' },
      { name: 'visionOS工程师', role: '空间应用' },
      { name: '3D设计师', role: '空间界面' },
    ],
  },
}

const TEAM_IDS = Object.keys(TEAM_NAME_MAP)

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // 加载团队数据
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const enabledMap: Record<string, boolean> = stored ? JSON.parse(stored) : {}

    const teamData: Team[] = TEAM_IDS.map((id) => {
      const info = TEAM_NAME_MAP[id]
      return {
        id,
        name: info.name,
        description: info.description,
        members: info.members,
        enabled: enabledMap[id] ?? true,
      }
    })

    setTeams(teamData)
    setLoading(false)
  }, [])

  const toggleTeam = (teamId: string) => {
    setTeams(prev => {
      const updated = prev.map(t =>
        t.id === teamId ? { ...t, enabled: !t.enabled } : t
      )
      // 保存到 localStorage
      const enabledMap: Record<string, boolean> = {}
      updated.forEach(t => { enabledMap[t.id] = t.enabled })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledMap))
      return updated
    })
  }

  const filteredTeams = teams.filter(t =>
    !searchQuery ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const enabledCount = teams.filter(t => t.enabled).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-dark-card rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5 bg-dark-card rounded-2xl border border-dark-border animate-pulse">
              <div className="h-5 bg-dark-bg rounded w-2/3 mb-3" />
              <div className="h-3 bg-dark-bg rounded w-full mb-4" />
              <div className="h-3 bg-dark-bg rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">团队配置</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            已启用 <span className="text-cyan-400 font-semibold">{enabledCount}</span> / {teams.length} 个团队
          </p>
        </div>
      </div>

      {/* 搜索 */}
      <div className="max-w-sm">
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-20 group-focus-within:opacity-40 transition duration-300" />
          <div className="relative flex items-center bg-dark-card/80 backdrop-blur-xl rounded-xl border border-dark-border">
            <svg className="w-4 h-4 text-slate-400 ml-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索团队..."
              className="w-full px-4 py-3 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none rounded-xl text-sm"
            />
          </div>
        </div>
      </div>

      {/* 团队网格 */}
      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className={`group relative p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border transition-all duration-300 ${
                team.enabled
                  ? 'border-dark-border hover:border-cyan-500/40 shadow-lg shadow-black/20'
                  : 'border-dark-border/50 opacity-60'
              }`}
            >
              {/* 启用开关 */}
              <button
                onClick={() => toggleTeam(team.id)}
                className={`absolute top-4 right-4 relative w-11 h-6 rounded-full transition-colors ${
                  team.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    team.enabled ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>

              {/* 团队名称 */}
              <div className="flex items-start gap-3 mb-3 pr-14">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  team.enabled
                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
                    : 'bg-slate-800/50 border border-slate-700/50'
                }`}>
                  <svg className={`w-5 h-5 ${team.enabled ? 'text-cyan-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`font-semibold text-base leading-tight ${team.enabled ? 'text-foreground' : 'text-slate-400'}`}>
                    {team.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      team.enabled
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-700/50 text-slate-500 border border-slate-600/30'
                    }`}>
                      {team.members.length} 个成员
                    </span>
                    <StatusBadge status={team.enabled ? 'active' : 'inactive'} size="sm" />
                  </div>
                </div>
              </div>

              {/* 描述 */}
              <p className={`text-sm leading-relaxed mb-4 ${team.enabled ? 'text-muted-foreground' : 'text-slate-500'}`}>
                {team.description}
              </p>

              {/* 成员列表 */}
              {team.members.length > 0 && (
                <div className="border-t border-dark-border/50 pt-3">
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">成员</p>
                  <div className="flex flex-wrap gap-1.5">
                    {team.members.slice(0, 8).map((member) => (
                      <span
                        key={member.name}
                        className={`text-xs px-2 py-1 rounded-lg font-medium ${
                          team.enabled
                            ? 'bg-dark-bg/80 text-slate-300 border border-dark-border'
                            : 'bg-slate-800/50 text-slate-500 border border-slate-700/30'
                        }`}
                        title={member.role}
                      >
                        {member.name}
                      </span>
                    ))}
                    {team.members.length > 8 && (
                      <span className="text-xs px-2 py-1 rounded-lg bg-dark-bg/50 text-slate-500 border border-dark-border/50">
                        +{team.members.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-dark-card/50 border border-dark-border/50 mb-6">
            <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">没有找到匹配的团队</h3>
          <p className="text-slate-500">尝试其他搜索词</p>
        </div>
      )}
    </div>
  )
}
