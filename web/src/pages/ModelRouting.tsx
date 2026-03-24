// 模型路由配置页面

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { modelApi, modelRoutingApi } from '../services/api'
import Modal from '../components/Modal'

interface Model {
  id: string
  name: string
  modelId: string
  type: string
  isDefault: boolean
}

interface RoutingRule {
  id: string
  name: string
  agentType: string
  taskType: string
  keywords: string[]
  modelId: string
  enabled: boolean
  priority: number
}

interface RuleFormData {
  name: string
  agentType: string
  taskType: string
  keywords: string
  modelId: string
  enabled: boolean
}

const defaultForm: RuleFormData = {
  name: '',
  agentType: '',
  taskType: '',
  keywords: '',
  modelId: '',
  enabled: true,
}

const taskTypeOptions = [
  { value: '', label: '不限' },
  { value: 'data', label: '数据处理' },
  { value: 'content', label: '文案创作' },
  { value: 'code', label: '代码生成' },
  { value: 'analysis', label: '分析推理' },
  { value: 'general', label: '通用对话' },
]

function RuleCard({ rule, models, onEdit, onDelete }: {
  rule: RoutingRule
  models: Model[]
  onEdit: () => void
  onDelete: () => void
}) {
  const model = models.find(m => m.id === rule.modelId)
  const priorityLabel = rule.priority >= 999 ? '兜底' : `优先级 ${rule.priority}`

  return (
    <div className="bg-[#1E2128] rounded-xl p-5 border border-dark-border hover:border-[#165DFF]/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">{rule.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-dark-bg text-[#86909C] border border-dark-border">
            {priorityLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle */}
          <button
            onClick={() => onEdit()}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#86909C] hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#86909C] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Match conditions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {rule.agentType && (
          <span className="text-xs px-2 py-0.5 rounded bg-[#FF7D00]/10 text-[#FF7D00] border border-[#FF7D00]/20">
            Agent: {rule.agentType}
          </span>
        )}
        {rule.taskType && (
          <span className="text-xs px-2 py-0.5 rounded bg-[#165DFF]/10 text-[#165DFF] border border-[#165DFF]/20">
            任务: {taskTypeOptions.find(t => t.value === rule.taskType)?.label || rule.taskType}
          </span>
        )}
        {rule.keywords.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded bg-[#00B42A]/10 text-[#00B42A] border border-[#00B42A]/20">
            关键词: {rule.keywords.join(', ')}
          </span>
        )}
      </div>

      {/* Model */}
      <div className="flex items-center gap-2 p-3 bg-dark-bg/60 rounded-lg">
        <svg className="w-4 h-4 text-[#86909C] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-sm text-white">{model?.name || rule.modelId}</span>
        <span className="text-xs text-[#86909C] ml-auto">{model?.modelId}</span>
      </div>

      {/* Status */}
      <div className="mt-3 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-[#00B42A]' : 'bg-[#86909C]'}`} />
        <span className="text-xs text-[#86909C]">{rule.enabled ? '已启用' : '已禁用'}</span>
      </div>
    </div>
  )
}

function RuleFormModal({ isOpen, onClose, rule, models, onSave }: {
  isOpen: boolean
  onClose: () => void
  rule?: RoutingRule | null
  models: Model[]
  onSave: (data: RuleFormData) => void
}) {
  const [form, setForm] = useState<RuleFormData>(defaultForm)

  useEffect(() => {
    if (rule) {
      setForm({
        name: rule.name,
        agentType: rule.agentType || '',
        taskType: rule.taskType || '',
        keywords: (rule.keywords || []).join(', '),
        modelId: rule.modelId,
        enabled: rule.enabled,
      })
    } else {
      setForm(defaultForm)
    }
  }, [rule, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={rule ? '编辑路由规则' : '添加路由规则'} width="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 规则名称 */}
        <div>
          <label className="block text-sm text-[#86909C] mb-1.5">规则名称</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="例如：数据处理任务路由"
            className="w-full bg-[#2A2D37] border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B4B4B] focus:outline-none focus:border-[#165DFF]"
            required
          />
        </div>

        {/* 匹配条件 Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Agent 类型 */}
          <div>
            <label className="block text-sm text-[#86909C] mb-1.5">Agent 类型</label>
            <input
              type="text"
              value={form.agentType}
              onChange={e => setForm({ ...form, agentType: e.target.value })}
              placeholder="例如：coordinator（留空不限）"
              className="w-full bg-[#2A2D37] border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B4B4B] focus:outline-none focus:border-[#165DFF]"
            />
          </div>

          {/* 任务类型 */}
          <div>
            <label className="block text-sm text-[#86909C] mb-1.5">任务类型</label>
            <select
              value={form.taskType}
              onChange={e => setForm({ ...form, taskType: e.target.value })}
              className="w-full bg-[#2A2D37] border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#165DFF]"
            >
              {taskTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 关键词 */}
        <div>
          <label className="block text-sm text-[#86909C] mb-1.5">关键词（逗号分隔）</label>
          <input
            type="text"
            value={form.keywords}
            onChange={e => setForm({ ...form, keywords: e.target.value })}
            placeholder="例如：数据, 分析, 报表, 统计"
            className="w-full bg-[#2A2D37] border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B4B4B] focus:outline-none focus:border-[#165DFF]"
          />
        </div>

        {/* 分配的模型 */}
        <div>
          <label className="block text-sm text-[#86909C] mb-1.5">分配模型</label>
          <select
            value={form.modelId}
            onChange={e => setForm({ ...form, modelId: e.target.value })}
            className="w-full bg-[#2A2D37] border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#165DFF]"
            required
          >
            <option value="">选择模型</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} {m.isDefault ? '(默认)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 启用 */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-10 h-5 rounded-full transition-colors relative ${
                form.enabled ? 'bg-[#165DFF]' : 'bg-[#2A2D37] border border-dark-border'
              }`}
              onClick={() => setForm({ ...form, enabled: !form.enabled })}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  form.enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-white">启用规则</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-dark-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-[#86909C] hover:text-white hover:bg-white/5 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm bg-[#165DFF] text-white hover:bg-[#165DFF]/80 transition-colors"
          >
            {rule ? '保存修改' : '添加规则'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function ModelRouting() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelApi.getAll().then(res => res.data as { models: Model[] }),
  })

  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['model-routing'],
    queryFn: () => modelRoutingApi.getAll().then(res => res.data as { rules: RoutingRule[] }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => modelRoutingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-routing'] })
      setShowForm(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      modelRoutingApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-routing'] })
      setEditingRule(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => modelRoutingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-routing'] })
      setDeleteConfirm(null)
    },
  })

  const handleSave = (formData: RuleFormData) => {
    const payload = {
      name: formData.name,
      agentType: formData.agentType,
      taskType: formData.taskType,
      keywords: (formData.keywords as string).split(',').map((k: string) => k.trim()).filter(Boolean),
      modelId: formData.modelId,
      enabled: formData.enabled,
    }
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const models = modelsData?.models || []
  const rules = rulesData?.rules || []
  const isLoading = modelsLoading || rulesLoading

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">模型路由</h2>
          <p className="text-sm text-[#86909C] mt-0.5">配置任务到模型的路由规则，按优先级匹配</p>
        </div>
        <button
          onClick={() => { setEditingRule(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#165DFF] hover:bg-[#165DFF]/80 text-white text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加规则
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-4 p-3 bg-[#165DFF]/10 border border-[#165DFF]/20 rounded-xl text-sm text-[#165DFF]">
        💡 路由规则按优先级顺序匹配，优先级数字越小越先匹配。关键词匹配优先级最高，其次是任务类型，最后是 Agent 类型。
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#165DFF] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Rules Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rules.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              models={models}
              onEdit={() => setEditingRule(rule)}
              onDelete={() => setDeleteConfirm(rule.id)}
            />
          ))}
          {rules.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-[#86909C]">
              <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">暂无路由规则</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <RuleFormModal
        isOpen={showForm || !!editingRule}
        onClose={() => { setShowForm(false); setEditingRule(null); }}
        rule={editingRule}
        models={models}
        onSave={handleSave}
      />

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal isOpen={true} onClose={() => setDeleteConfirm(null)} title="确认删除" width="sm">
          <p className="text-sm text-[#86909C] mb-4">确定要删除这条路由规则吗？</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 rounded-lg text-sm text-[#86909C] hover:text-white hover:bg-white/5 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => deleteMutation.mutate(deleteConfirm)}
              className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              删除
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
