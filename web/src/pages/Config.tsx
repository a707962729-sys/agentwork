// 员工配置演示页面

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeApi, marketSkillApi, marketWorkflowApi } from '../services/api'
import { useAppStore } from '../store/appStore'

// Mock 技能数据
const mockSkills = [
  { id: 'sk1', name: '数据采集', type: 'official' as const },
  { id: 'sk2', name: '文案写作', type: 'official' as const },
  { id: 'sk3', name: 'CRM集成', type: 'official' as const },
  { id: 'sk4', name: '报表生成', type: 'official' as const },
  { id: 'sk5', name: 'Excel处理', type: 'official' as const },
  { id: 'sk6', name: '行业报告生成', type: 'developer' as const },
  { id: 'sk7', name: 'BI可视化', type: 'developer' as const },
  { id: 'sk8', name: 'SEO优化助手', type: 'developer' as const },
]

// Mock 工作流数据
const mockWorkflows = [
  { id: 'wf1', name: '数据采集分析流程' },
  { id: 'wf2', name: '内容创作发布流程' },
  { id: 'wf3', name: '客户全生命周期管理' },
  { id: 'wf4', name: '金融行业报告工作流' },
]

const roles = ['数据处理', '文案创作', '客户跟进', '报表生成']
const workModes = ['全职', '兼职', '手动触发']

// 默认头像
const defaultAvatars = ['智', '文', '客', '报', '宝', '创', '通', '星']

// 经验包相关类型
interface ExperienceCase {
  id: string
  name: string
  solution: string
  result: string
  success: boolean
}

interface ExperiencePackage {
  version: string
  employeeId: string
  identity: string
  workflow: string
  cases: ExperienceCase[]
  preferences: Record<string, string | string[]>
}

interface FormData {
  name: string
  role: string
  workMode: string
  avatar: string
  workflows: string[]
  skills: string[]
  experienceId?: string
}

interface FormErrors {
  name?: string
  skills?: string
}

// Tab 类型
type ConfigTab = 'basic' | 'skills' | 'workflow' | 'experience'

// 默认经验包
const defaultExperiencePackage: ExperiencePackage = {
  version: '1.0',
  employeeId: '',
  identity: '',
  workflow: '',
  cases: [],
  preferences: {},
}

// 经验包编辑器组件
function ExperiencePackageEditor({
  experience,
  onChange,
}: {
  experience: ExperiencePackage
  onChange: (exp: ExperiencePackage) => void
}) {
  // 添加案例
  const addCase = () => {
    const newCase: ExperienceCase = {
      id: `case-${Date.now()}`,
      name: '',
      solution: '',
      result: '',
      success: true,
    }
    onChange({ ...experience, cases: [...experience.cases, newCase] })
  }

  // 删除案例
  const removeCase = (caseId: string) => {
    onChange({ ...experience, cases: experience.cases.filter(c => c.id !== caseId) })
  }

  // 更新案例
  const updateCase = (caseId: string, updates: Partial<ExperienceCase>) => {
    onChange({
      ...experience,
      cases: experience.cases.map(c => (c.id === caseId ? { ...c, ...updates } : c)),
    })
  }

  // 添加偏好项
  const addPreference = () => {
    const key = `新偏好项_${Date.now()}`
    onChange({
      ...experience,
      preferences: { ...experience.preferences, [key]: '' },
    })
  }

  // 删除偏好项
  const removePreference = (key: string) => {
    const newPrefs = { ...experience.preferences }
    delete newPrefs[key]
    onChange({ ...experience, preferences: newPrefs })
  }

  // 更新偏好项
  const updatePreference = (oldKey: string, newKey: string, value: string | string[]) => {
    const newPrefs: Record<string, string | string[]> = {}
    Object.entries(experience.preferences).forEach(([k, v]) => {
      if (k === oldKey) {
        newPrefs[newKey] = value
      } else {
        newPrefs[k] = v
      }
    })
    onChange({ ...experience, preferences: newPrefs })
  }

  return (
    <div className="space-y-6">
      {/* 1. 身份自述 */}
      <div>
        <label className="block text-sm text-[#86909C] mb-2">
          <span className="text-[#165DFF] mr-1">1.</span> 身份自述
        </label>
        <p className="text-xs text-[#86909C]/70 mb-2">
          描述员工的专业背景、经验和能力范围
        </p>
        <textarea
          value={experience.identity}
          onChange={e => onChange({ ...experience, identity: e.target.value })}
          placeholder="例如：我是一名资深数据分析师，擅长从数据中发现规律和商业洞察。我有5年的电商数据分析经验，精通 Python、SQL 和可视化。"
          rows={4}
          className="w-full px-4 py-3 bg-[#121418] border border-dark-border rounded-lg text-white placeholder-[#86909C]/50 focus:outline-none focus:border-[#165DFF] resize-none text-sm leading-relaxed"
        />
      </div>

      {/* 2. 工作流程 */}
      <div>
        <label className="block text-sm text-[#86909C] mb-2">
          <span className="text-[#165DFF] mr-1">2.</span> 工作流程
        </label>
        <p className="text-xs text-[#86909C]/70 mb-2">
          描述员工的标准工作步骤，使用编号列表格式
        </p>
        <textarea
          value={experience.workflow}
          onChange={e => onChange({ ...experience, workflow: e.target.value })}
          placeholder="例如：
1. 接收数据分析需求
2. 数据采集与清洗
3. 探索性分析（EDA）
4. 建模与分析
5. 生成分析报告（含可视化图表）
6. 结果汇报与建议"
          rows={6}
          className="w-full px-4 py-3 bg-[#121418] border border-dark-border rounded-lg text-white placeholder-[#86909C]/50 focus:outline-none focus:border-[#165DFF] resize-none text-sm leading-relaxed font-mono"
        />
      </div>

      {/* 3. 成功案例 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-[#86909C]">
            <span className="text-[#165DFF] mr-1">3.</span> 成功案例
          </label>
          <button
            type="button"
            onClick={addCase}
            className="px-3 py-1 text-xs bg-[#165DFF]/10 text-[#165DFF] rounded-lg hover:bg-[#165DFF]/20 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加案例
          </button>
        </div>
        <p className="text-xs text-[#86909C]/70 mb-3">
          记录员工处理过的典型场景，展示其专业能力
        </p>

        {experience.cases.length === 0 ? (
          <div className="bg-[#121418] border border-dashed border-dark-border rounded-lg p-6 text-center">
            <p className="text-sm text-[#86909C]">暂无案例，点击上方按钮添加</p>
          </div>
        ) : (
          <div className="space-y-3">
            {experience.cases.map((c, idx) => (
              <div key={c.id} className="bg-[#121418] border border-dark-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#86909C] bg-[#1E2128] px-2 py-0.5 rounded">
                      案例 {idx + 1}
                    </span>
                    {/* 成功/失败切换 */}
                    <button
                      type="button"
                      onClick={() => updateCase(c.id, { success: !c.success })}
                      className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 transition-colors ${
                        c.success
                          ? 'bg-[#00B42A]/10 text-[#00B42A]'
                          : 'bg-[#F53F3F]/10 text-[#F53F3F]'
                      }`}
                    >
                      {c.success ? '✅ 成功' : '❌ 失败'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCase(c.id)}
                    className="text-[#86909C] hover:text-[#F53F3F] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 场景名称 */}
                <div>
                  <label className="block text-xs text-[#86909C] mb-1">场景名称</label>
                  <input
                    type="text"
                    value={c.name}
                    onChange={e => updateCase(c.id, { name: e.target.value })}
                    placeholder="例如：为电商客户优化库存预测模型"
                    className="w-full px-3 py-2 bg-[#1E2128] border border-dark-border rounded-lg text-white placeholder-[#86909C]/50 focus:outline-none focus:border-[#165DFF] text-sm"
                  />
                </div>

                {/* 解决方案 */}
                <div>
                  <label className="block text-xs text-[#86909C] mb-1">解决方案</label>
                  <textarea
                    value={c.solution}
                    onChange={e => updateCase(c.id, { solution: e.target.value })}
                    placeholder="描述解决方案的具体步骤和方法..."
                    rows={2}
                    className="w-full px-3 py-2 bg-[#1E2128] border border-dark-border rounded-lg text-white placeholder-[#86909C]/50 focus:outline-none focus:border-[#165DFF] text-sm resize-none"
                  />
                </div>

                {/* 最终结果 */}
                <div>
                  <label className="block text-xs text-[#86909C] mb-1">最终结果</label>
                  <textarea
                    value={c.result}
                    onChange={e => updateCase(c.id, { result: e.target.value })}
                    placeholder="描述最终取得的成果和指标..."
                    rows={2}
                    className="w-full px-3 py-2 bg-[#1E2128] border border-dark-border rounded-lg text-white placeholder-[#86909C]/50 focus:outline-none focus:border-[#165DFF] text-sm resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. 个人偏好 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-[#86909C]">
            <span className="text-[#165DFF] mr-1">4.</span> 个人偏好
          </label>
          <button
            type="button"
            onClick={addPreference}
            className="px-3 py-1 text-xs bg-[#165DFF]/10 text-[#165DFF] rounded-lg hover:bg-[#165DFF]/20 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加偏好
          </button>
        </div>
        <p className="text-xs text-[#86909C]/70 mb-3">
          设置员工的工具偏好、风格偏好和禁忌事项
        </p>

        {Object.keys(experience.preferences).length === 0 ? (
          <div className="bg-[#121418] border border-dashed border-dark-border rounded-lg p-6 text-center">
            <p className="text-sm text-[#86909C]">暂无偏好设置，点击上方按钮添加</p>
          </div>
        ) : (
          <div className="bg-[#121418] border border-dark-border rounded-lg divide-y divide-dark-border">
            {Object.entries(experience.preferences).map(([key, value]) => (
              <div key={key} className="p-3 flex items-center gap-3">
                <input
                  type="text"
                  value={key}
                  onChange={e => updatePreference(key, e.target.value, value)}
                  className="flex-1 px-3 py-1.5 bg-[#1E2128] border border-dark-border rounded-lg text-white placeholder-[#86909C]/50 focus:outline-none focus:border-[#165DFF] text-sm"
                  placeholder="偏好名称"
                />
                <span className="text-[#86909C]">:</span>
                <input
                  type="text"
                  value={Array.isArray(value) ? value.join(', ') : value}
                  onChange={e => {
                    const val = e.target.value
                    const isArray = val.includes(',')
                    updatePreference(key, key, isArray ? val.split(',').map(s => s.trim()).filter(Boolean) : val)
                  }}
                  className="flex-1 px-3 py-1.5 bg-[#1E2128] border border-dark-border rounded-lg text-white placeholder-[#86909C]/50 focus:outline-none focus:border-[#165DFF] text-sm"
                  placeholder="偏好值（逗号分隔多项）"
                />
                <button
                  type="button"
                  onClick={() => removePreference(key)}
                  className="text-[#86909C] hover:text-[#F53F3F] transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 预设模板 */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-[#86909C]">快速添加：</span>
          {['工具', '报告风格', '禁忌', '沟通偏好'].map(template => (
            <button
              key={template}
              type="button"
              onClick={() => {
                if (!experience.preferences[template]) {
                  onChange({
                    ...experience,
                    preferences: { ...experience.preferences, [template]: '' },
                  })
                }
              }}
              className="px-2 py-0.5 text-xs bg-[#1E2128] text-[#86909C] rounded border border-dark-border hover:text-white hover:border-[#165DFF]/50 transition-colors"
            >
              + {template}
            </button>
          ))}
        </div>
      </div>

      {/* 经验包 JSON 预览 */}
      <details className="group">
        <summary className="text-xs text-[#86909C] cursor-pointer hover:text-white transition-colors flex items-center gap-1">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          预览 JSON
        </summary>
        <pre className="mt-2 p-3 bg-[#121418] border border-dark-border rounded-lg text-xs text-[#86909C] overflow-x-auto">
          {JSON.stringify(experience, null, 2)}
        </pre>
      </details>
    </div>
  )
}

export default function Config() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    role: '',
    workMode: '全职',
    avatar: defaultAvatars[0],
    workflows: [],
    skills: [],
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<ConfigTab>('basic')
  const [experiencePackage, setExperiencePackage] = useState<ExperiencePackage>(defaultExperiencePackage)
  const { addNotification } = useAppStore()
  const queryClient = useQueryClient()

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

  // 获取员工列表（用于编辑）
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.getAll().then(res => res.data).catch(() => null),
  })

  // 合并技能数据
  const availableSkills = useMemo(() => {
    if (skillsData?.skills) {
      return skillsData.skills.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: s.type || 'official'
      }))
    }
    return mockSkills
  }, [skillsData])

  // 合并工作流数据
  const availableWorkflows = useMemo(() => {
    if (workflowsData?.workflows) {
      return workflowsData.workflows.map((w: any) => ({
        id: w.id,
        name: w.name
      }))
    }
    return mockWorkflows
  }, [workflowsData])

  // Tab 配置
  const tabs: { key: ConfigTab; label: string }[] = [
    { key: 'basic', label: '基础配置' },
    { key: 'skills', label: '技能绑定' },
    { key: 'workflow', label: '工作流' },
    { key: 'experience', label: '个人经验包' },
  ]

  // 检查 URL 参数，看是否是编辑模式
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('edit')
    if (editId && employeesData?.employees) {
      const employee = employeesData.employees.find((e: any) => e.id === editId)
      if (employee) {
        setFormData({
          name: employee.name,
          role: employee.role,
          workMode: employee.employmentType || '全职',
          avatar: employee.avatar || defaultAvatars[0],
          workflows: employee.workflows?.map((w: any) => w.id || w) || [],
          skills: employee.skills?.map((s: any) => s.id || s) || [],
          experienceId: employee.experienceId,
        })
        // 如果员工有关联的经验包ID，尝试加载
        if (employee.experienceId) {
          loadExperiencePackage(employee.experienceId)
        }
      }
    }
  }, [employeesData])

  // 加载经验包（从 localStorage 模拟，实际应从 API）
  const loadExperiencePackage = (experienceId: string) => {
    try {
      const stored = localStorage.getItem(`experience_${experienceId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setExperiencePackage(parsed)
      } else {
        setExperiencePackage({
          ...defaultExperiencePackage,
          employeeId: experienceId,
        })
      }
    } catch {
      setExperiencePackage({
        ...defaultExperiencePackage,
        employeeId: experienceId,
      })
    }
  }

  // 保存经验包（保存到 localStorage 模拟）
  const saveExperiencePackage = () => {
    const experienceId = formData.experienceId || `exp_${Date.now()}`
    const packageToSave = {
      ...experiencePackage,
      employeeId: experienceId,
      version: '1.0',
    }
    localStorage.setItem(`experience_${experienceId}`, JSON.stringify(packageToSave))
    return experienceId
  }

  // 创建员工 mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => employeeApi.create(data),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: '创建成功',
        message: `员工 ${formData.name} 创建成功`,
        timestamp: new Date().toISOString(),
      })
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      resetForm()
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '创建失败',
        message: error?.response?.data?.message || '无法创建员工，请稍后重试',
        timestamp: new Date().toISOString(),
      })
    },
  })

  // 更新员工 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => employeeApi.update(id, data),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: '更新成功',
        message: `员工 ${formData.name} 配置已更新`,
        timestamp: new Date().toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      // 清除 URL 参数
      window.history.replaceState({}, '', '/config')
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '更新失败',
        message: error?.response?.data?.message || '无法更新员工，请稍后重试',
        timestamp: new Date().toISOString(),
      })
    },
  })

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '请输入员工名称'
    }

    if (formData.skills.length === 0) {
      newErrors.skills = '请至少选择一个技能'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      workMode: '全职',
      avatar: defaultAvatars[0],
      workflows: [],
      skills: [],
      experienceId: undefined,
    })
    setExperiencePackage(defaultExperiencePackage)
    setErrors({})
    setActiveTab('basic')
    window.history.replaceState({}, '', '/config')
  }

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      addNotification({
        type: 'warning',
        title: '表单验证失败',
        message: '请检查表单填写是否完整',
        timestamp: new Date().toISOString(),
      })
      return
    }

    // 保存经验包并获取 ID
    const experienceId = saveExperiencePackage()

    const submitData = {
      name: formData.name,
      role: formData.role,
      employmentType: formData.workMode,
      avatar: formData.avatar,
      skills: formData.skills,
      workflows: formData.workflows,
      experienceId,
    }

    // 检查是否是编辑模式
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('edit')

    if (editId) {
      updateMutation.mutate({ id: editId, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  // 处理技能切换
  const handleSkillToggle = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(id => id !== skillId)
        : [...prev.skills, skillId]
    }))
    // 清除技能错误
    if (errors.skills) {
      setErrors(prev => ({ ...prev, skills: undefined }))
    }
  }

  // 处理工作流切换
  const handleWorkflowToggle = (workflowId: string) => {
    setFormData(prev => ({
      ...prev,
      workflows: prev.workflows.includes(workflowId)
        ? prev.workflows.filter(id => id !== workflowId)
        : [...prev.workflows, workflowId]
    }))
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // 检查是否是编辑模式
  const params = new URLSearchParams(window.location.search)
  const isEditMode = params.has('edit')

  // 渲染 Tab 内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-4">
            {/* 员工名称 */}
            <div>
              <label className="block text-sm text-[#86909C] mb-2">
                员工名称 <span className="text-[#F53F3F]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => {
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
                }}
                placeholder="请输入员工名称"
                className={`w-full px-4 py-2.5 bg-[#121418] border rounded-lg text-white placeholder-[#86909C] focus:outline-none transition-colors ${
                  errors.name ? 'border-[#F53F3F]' : 'border-dark-border focus:border-[#165DFF]'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-[#F53F3F] mt-1">{errors.name}</p>
              )}
            </div>

            {/* 岗位类型 */}
            <div>
              <label className="block text-sm text-[#86909C] mb-2">岗位类型</label>
              <div className="flex flex-wrap gap-2">
                {roles.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role }))}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      formData.role === role
                        ? 'bg-[#165DFF] text-white'
                        : 'bg-[#121418] text-[#86909C] hover:text-white border border-dark-border'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* 工作模式 */}
            <div>
              <label className="block text-sm text-[#86909C] mb-2">用工模式</label>
              <div className="flex gap-2">
                {workModes.map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, workMode: mode }))}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      formData.workMode === mode
                        ? 'bg-[#165DFF] text-white'
                        : 'bg-[#121418] text-[#86909C] hover:text-white border border-dark-border'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* 头像选择 */}
            <div>
              <label className="block text-sm text-[#86909C] mb-2">员工头像</label>
              <div className="flex flex-wrap gap-3">
                {defaultAvatars.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${
                      formData.avatar === avatar
                        ? 'bg-gradient-to-br from-[#165DFF] to-[#165DFF]/60 text-white ring-2 ring-[#165DFF]'
                        : 'bg-[#121418] text-[#86909C] hover:text-white border border-dark-border'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'skills':
        return (
          <div className="space-y-3">
            {/* 官方技能 */}
            <div>
              <p className="text-xs text-[#86909C] mb-2">官方技能</p>
              <div className="flex flex-wrap gap-2">
                {availableSkills.filter((s: { type: string }) => s.type === 'official').map((skill: { id: string; name: string }) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleSkillToggle(skill.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      formData.skills.includes(skill.id)
                        ? 'bg-[#165DFF] text-white'
                        : 'bg-[#121418] text-[#86909C] hover:text-white border border-dark-border'
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 开发者技能 */}
            <div>
              <p className="text-xs text-[#86909C] mb-2">开发者技能</p>
              <div className="flex flex-wrap gap-2">
                {availableSkills.filter((s: { type: string }) => s.type === 'developer').map((skill: { id: string; name: string }) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleSkillToggle(skill.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      formData.skills.includes(skill.id)
                        ? 'bg-[#00B42A] text-white'
                        : 'bg-[#121418] text-[#86909C] hover:text-white border border-dark-border'
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 技能错误提示 */}
            {errors.skills && (
              <p className="text-xs text-[#F53F3F]">{errors.skills}</p>
            )}
          </div>
        )

      case 'workflow':
        return (
          <div className="grid grid-cols-2 gap-3">
            {availableWorkflows.map((wf: { id: string; name: string }) => (
              <button
                key={wf.id}
                type="button"
                onClick={() => handleWorkflowToggle(wf.id)}
                className={`px-4 py-3 rounded-lg text-sm text-left transition-colors ${
                  formData.workflows.includes(wf.id)
                    ? 'bg-[#165DFF]/10 text-[#165DFF] border border-[#165DFF]/30'
                    : 'bg-[#121418] text-[#86909C] hover:text-white border border-dark-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                    formData.workflows.includes(wf.id)
                      ? 'bg-[#165DFF] border-[#165DFF]'
                      : 'border-[#86909C]'
                  }`}>
                    {formData.workflows.includes(wf.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{wf.name}</span>
                </div>
              </button>
            ))}
          </div>
        )

      case 'experience':
        return (
          <ExperiencePackageEditor
            experience={experiencePackage}
            onChange={setExperiencePackage}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold text-white">
          {isEditMode ? '编辑员工' : '员工配置演示'}
        </h1>
        <p className="text-sm text-[#86909C] mt-1">
          {isEditMode ? '编辑现有数字员工配置' : '配置新的数字员工或编辑现有员工'}
        </p>
      </div>

      {/* 成功提示 */}
      {showSuccess && (
        <div className="bg-[#00B42A]/10 border border-[#00B42A]/30 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#00B42A]"></span>
          <span className="text-sm text-[#00B42A]">配置已保存，数字员工创建成功</span>
        </div>
      )}

      {/* 配置表单 */}
      <form onSubmit={handleSubmit} className="bg-[#1E2128] rounded-xl border border-dark-border p-6 space-y-6">
        {/* Tab 导航 */}
        <div className="flex gap-1 bg-[#121418] p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[#165DFF] text-white'
                  : 'text-[#86909C] hover:text-white hover:bg-[#1E2128]'
              }`}
            >
              {tab.label}
              {tab.key === 'experience' && (
                <span className="ml-1 text-xs opacity-60">✨</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 内容 */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3 pt-4 border-t border-dark-border">
          <button
            type="button"
            onClick={resetForm}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#121418] text-[#86909C] rounded-lg hover:text-white border border-dark-border transition-colors disabled:opacity-50"
          >
            重置
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isEditMode ? '更新配置' : '保存配置'}
          </button>
        </div>
      </form>
    </div>
  )
}