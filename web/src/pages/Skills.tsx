// 技能与工作流市场页面

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { marketSkillApi, marketWorkflowApi } from '../services/api'
import Modal from '../components/Modal'

// Mock 技能数据
const mockOfficialSkills = [
  { id: 's1', name: '数据采集', description: '多源数据自动采集与整合', price: '免费', downloads: 2341, author: 'OneAgent', scenarios: ['数据报告', '市场分析'] },
  { id: 's2', name: '文案写作', description: '各类营销文案智能生成', price: '免费', downloads: 4521, author: 'OneAgent', scenarios: ['营销推广', '内容运营'] },
  { id: 's3', name: 'CRM集成', description: '主流CRM系统对接集成', price: '免费', downloads: 1876, author: 'OneAgent', scenarios: ['客户管理', '销售跟进'] },
  { id: 's4', name: '报表生成', description: '自动生成各类数据报表', price: '免费', downloads: 3214, author: 'OneAgent', scenarios: ['数据分析', '经营分析'] },
  { id: 's5', name: '邮件发送', description: '邮件批量发送与管理', price: '免费', downloads: 2156, author: 'OneAgent', scenarios: ['客户沟通', '营销触达'] },
  { id: 's6', name: 'Excel处理', description: 'Excel数据处理与分析', price: '免费', downloads: 5632, author: 'OneAgent', scenarios: ['数据整理', '报表制作'] },
]

const mockDeveloperSkills = [
  { id: 'ds1', name: '行业报告生成', description: '深度行业分析报告自动生成', price: '¥299/月', downloads: 342, author: 'DataLab', industry: '金融', scenarios: ['行业研究', '投资分析'] },
  { id: 'ds2', name: 'BI可视化', description: '商业智能数据可视化大屏', price: '¥199/月', downloads: 567, author: 'ecom.ai', industry: '零售', scenarios: ['数据展示', '经营监控'] },
  { id: 'ds3', name: '客服话术库', description: '智能客服对话脚本生成', price: '¥149/月', downloads: 823, author: 'ServicePro', industry: '电商', scenarios: ['客户服务', '售后支持'] },
  { id: 'ds4', name: 'SEO优化助手', description: '搜索引擎优化方案生成', price: '¥99/月', downloads: 1245, author: 'MKTPlus', industry: '营销', scenarios: ['网站优化', '流量获取'] },
]

// Mock 工作流数据
const mockOfficialWorkflows = [
  { id: 'w1', name: '数据采集分析流程', description: '自动采集→清洗→分析→报告', status: 'running' as const, steps: 4, users: 1234 },
  { id: 'w2', name: '内容创作发布流程', description: '选题→创作→审核→发布', status: 'active' as const, steps: 5, users: 892 },
  { id: 'w3', name: '客户全生命周期管理', description: '获客→跟进→转化→维护', status: 'active' as const, steps: 6, users: 567 },
]

const mockDeveloperWorkflows = [
  { id: 'dw1', name: '金融行业报告工作流', description: '数据采集→行业分析→报告生成', industry: '金融', author: 'DataLab', steps: 5, users: 234 },
  { id: 'dw2', name: '电商运营自动化流程', description: '选品→分析→文案→上架', industry: '电商', author: 'ecom.ai', steps: 4, users: 456 },
]

const STORAGE_KEY = 'oneagent_selected_skills'

interface Skill {
  id: string
  name: string
  description: string
  price: string
  downloads: number
  author?: string
  industry?: string
  scenarios?: string[]
  type: 'official' | 'developer'
}

interface Workflow {
  id: string
  name: string
  description: string
  status?: 'running' | 'active'
  industry?: string
  author?: string
  steps: number
  users: number
  type: 'official' | 'developer'
}

function SkillCard({
  skill,
  isSelected,
  onSelect,
  onDetail
}: {
  skill: Skill
  isSelected: boolean
  onSelect: () => void
  onDetail: () => void
}) {
  const isOfficial = skill.type === 'official'

  return (
    <div className="bg-[#1E2128] rounded-xl p-4 border border-dark-border hover:border-[#165DFF]/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-white">{skill.name}</h3>
          <span
            className="text-xs px-2 py-0.5 rounded cursor-pointer"
            style={{
              backgroundColor: isOfficial ? '#165DFF15' : '#00B42A15',
              color: isOfficial ? '#165DFF' : '#00B42A',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: isOfficial ? '#165DFF30' : '#00B42A30',
            }}
          >
            {isOfficial ? '官方' : '开发者'}
          </span>
        </div>
        <span className="text-xs text-[#86909C]">{skill.downloads}次使用</span>
      </div>
      <p className="text-xs text-[#86909C] mb-3">{skill.description}</p>
      {!isOfficial && skill.industry && (
        <span className="inline-block text-xs px-2 py-0.5 bg-[#FF7D00]/10 text-[#FF7D00] rounded mb-3">
          行业适配：{skill.industry}
        </span>
      )}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${isOfficial ? 'text-[#165DFF]' : 'text-[#00B42A]'}`}>
          {skill.price}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onDetail}
            className="text-xs px-3 py-1.5 text-[#86909C] hover:text-white transition-colors"
          >
            详情
          </button>
          <button
            onClick={onSelect}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              isSelected
                ? 'bg-[#00B42A] text-white'
                : isOfficial
                  ? 'bg-[#165DFF]/10 text-[#165DFF] hover:bg-[#165DFF]/20'
                  : 'bg-[#00B42A]/10 text-[#00B42A] hover:bg-[#00B42A]/20'
            }`}
          >
            {isSelected ? '已选用' : '选用'}
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkflowCard({ workflow, onDetail }: { workflow: Workflow; onDetail: () => void }) {
  const isOfficial = workflow.type === 'official'

  return (
    <div className="bg-[#1E2128] rounded-xl p-4 border border-dark-border hover:border-[#165DFF]/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-white">{workflow.name}</h3>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            backgroundColor: isOfficial ? '#165DFF15' : '#00B42A15',
            color: isOfficial ? '#165DFF' : '#00B42A',
          }}
        >
          {isOfficial ? '官方' : '开发者'}
        </span>
      </div>
      <p className="text-xs text-[#86909C] mb-3">{workflow.description}</p>

      {/* 状态/行业信息 */}
      {'status' in workflow && workflow.status && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-1.5 h-1.5 rounded-full ${workflow.status === 'running' ? 'bg-[#00B42A] animate-live' : 'bg-[#86909C]'}`}></span>
          <span className="text-xs text-[#86909C]">
            {workflow.status === 'running' ? '运行中' : '已启用'}
          </span>
        </div>
      )}
      {'industry' in workflow && workflow.industry && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#FF7D00]">{workflow.industry}</span>
          <span className="text-xs text-[#86909C]">·</span>
          <span className="text-xs text-[#86909C]">by {workflow.author}</span>
        </div>
      )}

      {/* 统计信息 */}
      <div className="flex items-center gap-4 text-xs text-[#86909C] mb-3">
        <span>{workflow.steps} 个步骤</span>
        <span>{workflow.users} 人使用</span>
      </div>

      <button
        onClick={onDetail}
        className={`w-full text-xs px-3 py-2 rounded-lg transition-colors ${
          isOfficial
            ? 'bg-[#165DFF]/10 text-[#165DFF] hover:bg-[#165DFF]/20'
            : 'bg-[#00B42A]/10 text-[#00B42A] hover:bg-[#00B42A]/20'
        }`}
      >
        查看详情
      </button>
    </div>
  )
}

function SkillDetailModal({ skill, isOpen, onClose, isSelected, onSelect }: {
  skill: Skill | null
  isOpen: boolean
  onClose: () => void
  isSelected: boolean
  onSelect: () => void
}) {
  if (!skill) return null

  const isOfficial = skill.type === 'official'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="技能详情" width="md">
      <div className="space-y-6">
        {/* 基本信息 */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-bold text-white">{skill.name}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: isOfficial ? '#165DFF15' : '#00B42A15',
                color: isOfficial ? '#165DFF' : '#00B42A',
              }}
            >
              {isOfficial ? '官方技能' : '开发者技能'}
            </span>
          </div>
          <p className="text-sm text-[#86909C]">{skill.description}</p>
        </div>

        {/* 价格和下载量 */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-[#86909C] mb-1">价格</p>
            <p className={`text-lg font-bold ${isOfficial ? 'text-[#165DFF]' : 'text-[#00B42A]'}`}>
              {skill.price}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#86909C] mb-1">下载量</p>
            <p className="text-lg font-bold text-white">{skill.downloads}</p>
          </div>
          {skill.author && (
            <div>
              <p className="text-xs text-[#86909C] mb-1">作者</p>
              <p className="text-lg font-bold text-white">{skill.author}</p>
            </div>
          )}
        </div>

        {/* 适用场景 */}
        {skill.scenarios && skill.scenarios.length > 0 && (
          <div>
            <p className="text-sm font-medium text-white mb-2">适用场景</p>
            <div className="flex flex-wrap gap-2">
              {skill.scenarios.map((s, i) => (
                <span key={i} className="text-xs px-3 py-1 bg-[#121418] text-[#86909C] rounded-lg">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4 border-t border-dark-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[#121418] text-[#86909C] rounded-lg hover:text-white border border-dark-border transition-colors text-sm font-medium"
          >
            关闭
          </button>
          <button
            onClick={() => {
              onSelect()
              onClose()
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
              isSelected
                ? 'bg-[#00B42A] text-white'
                : isOfficial
                  ? 'bg-[#165DFF] text-white hover:bg-[#165DFF]/90'
                  : 'bg-[#00B42A] text-white hover:bg-[#00B42A]/90'
            }`}
          >
            {isSelected ? '已选用' : '选用'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function WorkflowDetailModal({ workflow, isOpen, onClose }: {
  workflow: Workflow | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!workflow) return null

  const isOfficial = workflow.type === 'official'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="工作流详情" width="md">
      <div className="space-y-6">
        {/* 基本信息 */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-bold text-white">{workflow.name}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: isOfficial ? '#165DFF15' : '#00B42A15',
                color: isOfficial ? '#165DFF' : '#00B42A',
              }}
            >
              {isOfficial ? '官方工作流' : '开发者工作流'}
            </span>
          </div>
          <p className="text-sm text-[#86909C]">{workflow.description}</p>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-[#86909C] mb-1">步骤数</p>
            <p className="text-lg font-bold text-white">{workflow.steps}</p>
          </div>
          <div>
            <p className="text-xs text-[#86909C] mb-1">使用人数</p>
            <p className="text-lg font-bold text-white">{workflow.users}</p>
          </div>
          {workflow.author && (
            <div>
              <p className="text-xs text-[#86909C] mb-1">作者</p>
              <p className="text-lg font-bold text-white">{workflow.author}</p>
            </div>
          )}
          {workflow.industry && (
            <div>
              <p className="text-xs text-[#86909C] mb-1">适用行业</p>
              <p className="text-lg font-bold text-white">{workflow.industry}</p>
            </div>
          )}
        </div>

        {/* 状态 */}
        {'status' in workflow && workflow.status && (
          <div>
            <p className="text-xs text-[#86909C] mb-1">状态</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${workflow.status === 'running' ? 'bg-[#00B42A] animate-live' : 'bg-[#86909C]'}`}></span>
              <span className="text-sm text-white">
                {workflow.status === 'running' ? '运行中' : '已启用'}
              </span>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4 border-t border-dark-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[#121418] text-[#86909C] rounded-lg hover:text-white border border-dark-border transition-colors text-sm font-medium"
          >
            关闭
          </button>
          <button
            className={`flex-1 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
              isOfficial
                ? 'bg-[#165DFF] text-white hover:bg-[#165DFF]/90'
                : 'bg-[#00B42A] text-white hover:bg-[#00B42A]/90'
            }`}
          >
            使用此工作流
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Skills() {
  const [activeTab, setActiveTab] = useState<'skills' | 'workflows'>('skills')
  const [skillFilter, setSkillFilter] = useState<'all' | 'official' | 'developer'>('all')
  const [skillSearch, setSkillSearch] = useState('')
  const [workflowFilter, setWorkflowFilter] = useState<'all' | 'official' | 'developer'>('all')
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null)
  const [detailWorkflow, setDetailWorkflow] = useState<Workflow | null>(null)
  const [skillModalOpen, setSkillModalOpen] = useState(false)
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false)

  // 从 localStorage 恢复已选技能
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSelectedSkills(new Set(parsed))
      } catch {
        // ignore
      }
    }
  }, [])

  // 保存已选技能到 localStorage
  const saveSelectedSkills = (skills: Set<string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...skills]))
    setSelectedSkills(skills)
  }

  // 获取市场技能列表
  const { data: skillsData } = useQuery({
    queryKey: ['skills-market'],
    queryFn: () => marketSkillApi.getAll().then(res => res.data).catch(() => null),
  })

  // 获取市场工作流列表
  const { data: workflowsData } = useQuery({
    queryKey: ['workflows-market'],
    queryFn: () => marketWorkflowApi.getAll().then(res => res.data).catch(() => null),
  })

  // 合并 API 数据和 mock 数据
  const allSkills: Skill[] = useMemo(() => {
    const official: Skill[] = skillsData?.official
      ? skillsData.official.map((s: any) => ({ ...s, type: 'official' as const }))
      : mockOfficialSkills.map(s => ({ ...s, type: 'official' as const }))
    const developer: Skill[] = skillsData?.developer
      ? skillsData.developer.map((s: any) => ({ ...s, type: 'developer' as const }))
      : mockDeveloperSkills.map(s => ({ ...s, type: 'developer' as const }))
    return [...official, ...developer]
  }, [skillsData])

  const allWorkflows: Workflow[] = useMemo(() => {
    const official: Workflow[] = workflowsData?.official
      ? workflowsData.official.map((w: any) => ({ ...w, type: 'official' as const }))
      : mockOfficialWorkflows.map(w => ({ ...w, type: 'official' as const }))
    const developer: Workflow[] = workflowsData?.developer
      ? workflowsData.developer.map((w: any) => ({ ...w, type: 'developer' as const }))
      : mockDeveloperWorkflows.map(w => ({ ...w, type: 'developer' as const }))
    return [...official, ...developer]
  }, [workflowsData])

  // 筛选后的技能
  const filteredSkills = useMemo(() => {
    return allSkills.filter(skill => {
      if (skillFilter !== 'all' && skill.type !== skillFilter) return false
      if (skillSearch && !skill.name.toLowerCase().includes(skillSearch.toLowerCase())) return false
      return true
    })
  }, [allSkills, skillFilter, skillSearch])

  // 筛选后的工作流
  const filteredWorkflows = useMemo(() => {
    return allWorkflows.filter(wf => {
      if (workflowFilter !== 'all' && wf.type !== workflowFilter) return false
      return true
    })
  }, [allWorkflows, workflowFilter])

  // 获取已选技能详情
  const selectedSkillsList = useMemo(() => {
    return allSkills.filter(s => selectedSkills.has(s.id))
  }, [allSkills, selectedSkills])

  const handleSkillSelect = (skillId: string) => {
    const newSelected = new Set(selectedSkills)
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId)
    } else {
      newSelected.add(skillId)
    }
    saveSelectedSkills(newSelected)
  }

  const handleBatchConfig = () => {
    // 跳转到员工配置页面
    window.location.href = '/config?batch=true'
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold text-white">技能与工作流市场</h1>
        <p className="text-sm text-[#86909C] mt-1">为数字员工扩展能力边界</p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'skills'
              ? 'bg-[#165DFF] text-white'
              : 'bg-[#1E2128] text-[#86909C] hover:text-white border border-dark-border'
          }`}
        >
          技能市场
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'workflows'
              ? 'bg-[#165DFF] text-white'
              : 'bg-[#1E2128] text-[#86909C] hover:text-white border border-dark-border'
          }`}
        >
          工作流市场
        </button>
      </div>

      {/* 技能市场 */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {/* 搜索和筛选 */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="搜索技能名称..."
                className="w-full px-4 py-2 pl-10 bg-[#1E2128] border border-dark-border rounded-lg text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF] transition-colors"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86909C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-2">
              {(['all', 'official', 'developer'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSkillFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    skillFilter === f
                      ? 'bg-[#165DFF] text-white'
                      : 'bg-[#1E2128] text-[#86909C] hover:text-white border border-dark-border'
                  }`}
                >
                  {f === 'all' ? '全部' : f === 'official' ? '官方' : '开发者'}
                </button>
              ))}
            </div>
          </div>

          {/* 技能列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                isSelected={selectedSkills.has(skill.id)}
                onSelect={() => handleSkillSelect(skill.id)}
                onDetail={() => {
                  setDetailSkill(skill)
                  setSkillModalOpen(true)
                }}
              />
            ))}
          </div>

          {filteredSkills.length === 0 && (
            <div className="text-center py-12 bg-[#1E2128] rounded-xl border border-dark-border">
              <p className="text-[#86909C]">没有找到匹配的技能</p>
            </div>
          )}
        </div>
      )}

      {/* 工作流市场 */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          {/* 筛选 */}
          <div className="flex gap-2">
            {(['all', 'official', 'developer'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setWorkflowFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  workflowFilter === f
                    ? 'bg-[#165DFF] text-white'
                    : 'bg-[#1E2128] text-[#86909C] hover:text-white border border-dark-border'
                }`}
              >
                {f === 'all' ? '全部' : f === 'official' ? '官方' : '开发者'}
              </button>
            ))}
          </div>

          {/* 工作流列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkflows.map(workflow => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onDetail={() => {
                  setDetailWorkflow(workflow)
                  setWorkflowModalOpen(true)
                }}
              />
            ))}
          </div>

          {filteredWorkflows.length === 0 && (
            <div className="text-center py-12 bg-[#1E2128] rounded-xl border border-dark-border">
              <p className="text-[#86909C]">没有找到匹配的工作流</p>
            </div>
          )}
        </div>
      )}

      {/* 已选技能区域 */}
      {selectedSkills.size > 0 && (
        <div className="bg-[#1E2128] rounded-xl border border-dark-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">已选技能 ({selectedSkills.size})</h3>
            <button
              onClick={handleBatchConfig}
              className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors text-sm font-medium"
            >
              批量配置
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSkillsList.map(skill => (
              <span
                key={skill.id}
                className="text-xs px-3 py-1.5 bg-[#00B42A]/10 text-[#00B42A] rounded-lg flex items-center gap-2"
              >
                {skill.name}
                <button
                  onClick={() => handleSkillSelect(skill.id)}
                  className="hover:text-white transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 技能详情弹窗 */}
      <SkillDetailModal
        skill={detailSkill}
        isOpen={skillModalOpen}
        onClose={() => {
          setSkillModalOpen(false)
          setDetailSkill(null)
        }}
        isSelected={detailSkill ? selectedSkills.has(detailSkill.id) : false}
        onSelect={() => detailSkill && handleSkillSelect(detailSkill.id)}
      />

      {/* 工作流详情弹窗 */}
      <WorkflowDetailModal
        workflow={detailWorkflow}
        isOpen={workflowModalOpen}
        onClose={() => {
          setWorkflowModalOpen(false)
          setDetailWorkflow(null)
        }}
      />
    </div>
  )
}
