// 模型配置页面

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '../components/Modal'
import { modelApi } from '../services/api'

interface Model {
  id: string
  name: string
  modelId: string
  type: 'openai' | 'anthropic' | 'openai-compatible'
  baseUrl: string
  apiKey: string
  isDefault: boolean
  supports: string[]
}

interface ModelFormData {
  name: string
  modelId: string
  type: 'openai' | 'anthropic' | 'openai-compatible'
  baseUrl: string
  apiKey: string
  isDefault: boolean
  supports: string[]
}

const defaultForm: ModelFormData = {
  name: '',
  modelId: '',
  type: 'openai-compatible',
  baseUrl: '',
  apiKey: '',
  isDefault: false,
  supports: [],
}

const typeLabels: Record<string, string> = {
  'openai': 'OpenAI',
  'anthropic': 'Anthropic',
  'openai-compatible': 'OpenAI 兼容',
}

const supportOptions = [
  { value: 'chat', label: '对话' },
  { value: 'function-calling', label: '函数调用' },
  { value: 'vision', label: '视觉理解' },
  { value: 'embedding', label: '文本嵌入' },
]

function ModelCard({ model, onEdit, onDelete }: {
  model: Model
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-[#1E2128] rounded-xl p-5 border border-dark-border hover:border-[#165DFF]/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">{model.name}</h3>
          {model.isDefault && (
            <span className="text-xs px-2 py-0.5 rounded bg-[#165DFF]/20 text-[#165DFF] border border-[#165DFF]/30">
              默认
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
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

      {/* Model ID */}
      <div className="mb-3">
        <p className="text-xs text-[#86909C] mb-1">模型 ID</p>
        <p className="text-sm text-white/80 font-mono bg-black/20 rounded px-2 py-1 truncate">{model.modelId}</p>
      </div>

      {/* Type & Base URL */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-[#86909C] border border-dark-border">
          {typeLabels[model.type] || model.type}
        </span>
        {model.baseUrl && (
          <span className="text-xs text-[#86909C] truncate flex-1">{model.baseUrl}</span>
        )}
      </div>

      {/* API Key */}
      <div className="mb-3">
        <p className="text-xs text-[#86909C] mb-1">API Key</p>
        <p className="text-sm text-white/60 font-mono">
          {model.apiKey ? '••••••••' + model.apiKey.slice(-4) : '未设置'}
        </p>
      </div>

      {/* Supports */}
      {model.supports && model.supports.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {model.supports.map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded bg-[#00B42A]/10 text-[#00B42A] border border-[#00B42A]/20">
              {supportOptions.find(o => o.value === s)?.label || s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ModelFormModal({ isOpen, onClose, model, onSave }: {
  isOpen: boolean
  onClose: () => void
  model?: Model | null
  onSave: (data: ModelFormData) => void
}) {
  const [form, setForm] = useState<ModelFormData>(defaultForm)

  useEffect(() => {
    if (model) {
      setForm({
        name: model.name,
        modelId: model.modelId,
        type: model.type,
        baseUrl: model.baseUrl || '',
        apiKey: model.apiKey || '',
        isDefault: model.isDefault,
        supports: model.supports || [],
      })
    } else {
      setForm(defaultForm)
    }
  }, [model, isOpen])

  const toggleSupport = (value: string) => {
    setForm(prev => ({
      ...prev,
      supports: prev.supports.includes(value)
        ? prev.supports.filter(s => s !== value)
        : [...prev.supports, value],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={model ? '编辑模型' : '添加模型'} width="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 名称 */}
        <div>
          <label className="block text-sm text-[#86909C] mb-1.5">模型名称</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="例如：MiniMax 2.7"
            className="w-full bg-[#2A2D37] border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B4B4B] focus:outline-none focus:border-[#165DFF]"
            required
          />
        </div>

        {/* 模型 ID */}
        <div>
          <label className="block text-sm text-[#86909C] mb-1.5">模型 ID</label>
          <input
            type="text"
            value={form.modelId}
            onChange={e => setForm({ ...form, modelId: e.target.value })}
            placeholder="例如：minimax-portal/MiniMax-M2.7"
            className="w-full bg-[#2A2D37] border border-dark-border rounded-lg px-3 py-2 text-white text-sm font-mono placeholder-[#4B4B4B] focus:outline-none focus:border-[#165DFF]"
            required
          />
        </div>

        {/* 类型 */}
        <div>
          <label className="block text-sm text-[#86909C] mb-1.5">模型类型</label>
          <div className="flex gap-2">
            {(['openai', 'anthropic', 'openai-compatible'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.type === t
                    ? 'bg-[#165DFF]/20 text-[#165DFF] border-[#165DFF]/40'
                    : 'bg-[#2A2D37] text-[#86909C] border-dark-border hover:border-[#165DFF]/30'
                }`}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-sm text-[#86909C] mb-1.5">Base URL</label>
          <input
            type="url"
            value={form.baseUrl}
            onChange={e => setForm({ ...form, baseUrl: e.target.value })}
            placeholder="例如：https://api.minimaxi.chat"
            className="w-full bg-[#2A2D37] border border-dark-border rounded-lg px-3 py-2 text-white text-sm font-mono placeholder-[#4B4B4B] focus:outline-none focus:border-[#165DFF]"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm text-[#86909C] mb-1.5">API Key</label>
          <input
            type="password"
            value={form.apiKey}
            onChange={e => setForm({ ...form, apiKey: e.target.value })}
            placeholder="输入 API Key（留空则不修改）"
            className="w-full bg-[#2A2D37] border border-dark-border rounded-lg px-3 py-2 text-white text-sm font-mono placeholder-[#4B4B4B] focus:outline-none focus:border-[#165DFF]"
          />
        </div>

        {/* 是否默认 */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-10 h-5 rounded-full transition-colors relative ${
                form.isDefault ? 'bg-[#165DFF]' : 'bg-[#2A2D37] border border-dark-border'
              }`}
              onClick={() => setForm({ ...form, isDefault: !form.isDefault })}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  form.isDefault ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-white">设为默认模型</span>
          </label>
        </div>

        {/* 支持的能力 */}
        <div>
          <label className="block text-sm text-[#86909C] mb-1.5">支持的能力</label>
          <div className="flex flex-wrap gap-2">
            {supportOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleSupport(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.supports.includes(opt.value)
                    ? 'bg-[#00B42A]/20 text-[#00B42A] border-[#00B42A]/40'
                    : 'bg-[#2A2D37] text-[#86909C] border-dark-border hover:border-[#00B42A]/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
            {model ? '保存修改' : '添加模型'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Models() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelApi.getAll().then(res => res.data as { models: Model[] }),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<ModelFormData>) => modelApi.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      setShowForm(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ModelFormData> }) =>
      modelApi.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      setEditingModel(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => modelApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      setDeleteConfirm(null)
    },
  })

  const handleSave = (formData: ModelFormData) => {
    if (editingModel) {
      updateMutation.mutate({ id: editingModel.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const models = data?.models || []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">模型配置</h2>
          <p className="text-sm text-[#86909C] mt-0.5">管理常用的大模型配置，支持 OpenAI / Anthropic / OpenAI 兼容接口</p>
        </div>
        <button
          onClick={() => { setEditingModel(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#165DFF] hover:bg-[#165DFF]/80 text-white text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加模型
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#165DFF] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Model Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {models.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              onEdit={() => setEditingModel(model)}
              onDelete={() => setDeleteConfirm(model.id)}
            />
          ))}
          {models.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-[#86909C]">
              <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">暂无模型配置</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <ModelFormModal
        isOpen={showForm || !!editingModel}
        onClose={() => { setShowForm(false); setEditingModel(null); }}
        model={editingModel}
        onSave={handleSave}
      />

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal isOpen={true} onClose={() => setDeleteConfirm(null)} title="确认删除" width="sm">
          <p className="text-sm text-[#86909C] mb-4">确定要删除这个模型配置吗？删除后相关路由规则可能失效。</p>
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
