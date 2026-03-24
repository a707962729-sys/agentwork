import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 任务相关 API
export const taskApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/tasks', { params }),
  
  getById: (id: string) =>
    api.get(`/tasks/${id}`),
  
  create: (data: { title: string; description?: string; workflowId?: string }) =>
    api.post('/tasks', data),
  
  update: (id: string, data: Partial<{ title: string; description: string; status: string }>) =>
    api.put(`/tasks/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/tasks/${id}`),
  
  control: (id: string, action: 'pause' | 'resume' | 'cancel') =>
    api.post(`/tasks/${id}/control`, { action }),
  
  approveDecision: (decisionId: string, decision: 'approve' | 'reject') =>
    api.post(`/decisions/${decisionId}/approve`, { decision }),
  
  rejectDecision: (decisionId: string, reason: string) =>
    api.post(`/decisions/${decisionId}/reject`, { reason }),
}

// Agent 相关 API
export const agentApi = {
  getAll: () =>
    api.get('/agents'),
  
  getById: (id: string) =>
    api.get(`/agents/${id}`),
  
  getStatus: (id: string) =>
    api.get(`/agents/${id}/status`),
}

// 技能相关 API
export const skillApi = {
  getAll: () =>
    api.get('/skills'),
  
  install: (data: { name: string; source?: 'local' | 'npm' | 'clawhub'; path?: string }) =>
    api.post('/skills/install', data),
  
  uninstall: (name: string) =>
    api.delete(`/skills/${name}`),
  
  getDetails: (name: string) =>
    api.get(`/skills/${name}`),
}

// 工作流相关 API
export const workflowApi = {
  getAll: () =>
    api.get('/workflows'),
  
  getById: (id: string) =>
    api.get(`/workflows/${id}`),
  
  create: (data: { name: string; description: string; steps: any[] }) =>
    api.post('/workflows', data),
  
  update: (id: string, data: any) =>
    api.put(`/workflows/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/workflows/${id}`),
  
  execute: (id: string, params?: any) =>
    api.post(`/workflows/${id}/execute`, params),
  
  toggleStatus: (id: string, enabled: boolean) =>
    api.post(`/workflows/${id}/toggle`, { enabled }),
}

// 聊天相关 API
export const chatApi = {
  send: (message: string) =>
    api.post('/chat', { message }),

  sendWithFiles: (formData: FormData) =>
    api.post('/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getHistory: (limit?: number) =>
    api.get('/chat/history', { params: { limit } }),
}

// 系统相关 API
export const systemApi = {
  getStatus: () =>
    api.get('/system/status'),
  
  getStats: () =>
    api.get('/system/stats'),
}

// Dashboard 统计数据
export const dashboardApi = {
  getStats: () =>
    api.get('/stats/dashboard'),
}

// 员工相关 API
export const employeeApi = {
  getAll: () =>
    api.get('/employees'),
  
  getById: (id: string) =>
    api.get(`/employees/${id}`),
  
  create: (data: {
    name: string
    role: string
    employmentType: string
    avatar?: string
    skills?: string[]
    workflows?: string[]
  }) =>
    api.post('/employees', data),
  
  update: (id: string, data: Partial<{
    name: string
    role: string
    employmentType: string
    avatar?: string
    skills?: string[]
    workflows?: string[]
  }>) =>
    api.put(`/employees/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/employees/${id}`),
}

// 资产相关 API
export const assetApi = {
  getAll: (params?: { type?: 'document' | 'data' | 'report'; page?: number; limit?: number }) =>
    api.get('/assets', { params }),
  
  getToday: () =>
    api.get('/assets/today'),
  
  getById: (id: string) =>
    api.get(`/assets/${id}`),
  
  download: (id: string) =>
    api.get(`/assets/${id}/download`, { responseType: 'blob' }),
}

// 市场技能相关 API
export const marketSkillApi = {
  getAll: () =>
    api.get('/skills/market'),
  
  getById: (id: string) =>
    api.get(`/skills/market/${id}`),
}

// 市场工作流相关 API
export const marketWorkflowApi = {
  getAll: () =>
    api.get('/workflows/market'),
  
  getById: (id: string) =>
    api.get(`/workflows/market/${id}`),
}

// 执行引擎 API
export const executeApi = {
  // 提交任务
  submitTask: (agentId: string, input: { type: 'text' | 'json'; content: string | object; context?: Record<string, any> }) =>
    api.post('/execute/agent', { agentId, input }),

  // 任务状态
  getTask: (taskId: string) =>
    api.get(`/execute/task/${taskId}`),

  // 中止任务
  abortTask: (taskId: string) =>
    api.post(`/execute/task/${taskId}/abort`),

  // 执行统计
  getStats: () =>
    api.get('/execute/stats'),

  // 注册 Agent
  registerAgent: (agent: {
    id: string
    name: string
    model: string
    modelType?: 'openai' | 'anthropic' | 'openai-compatible'
    apiKey?: string
    baseUrl?: string
    systemPrompt?: string
    tools?: string[]
    skills?: string[]
  }) =>
    api.post('/execute/agents', agent),

  // Agent 列表
  listAgents: () =>
    api.get('/execute/agents'),

  // Agent 详情
  getAgent: (id: string) =>
    api.get(`/execute/agents/${id}`),
}

// 模型配置 API
export const modelApi = {
  getAll: () =>
    api.get('/models'),

  getById: (id: string) =>
    api.get(`/models/${id}`),

  create: (data: {
    name: string
    modelId: string
    type?: string
    baseUrl?: string
    apiKey?: string
    isDefault?: boolean
    supports?: string[]
  }) =>
    api.post('/models', data),

  update: (id: string, data: Partial<{
    name: string
    modelId: string
    type: string
    baseUrl: string
    apiKey: string
    isDefault: boolean
    supports: string[]
  }>) =>
    api.put(`/models/${id}`, data),

  delete: (id: string) =>
    api.delete(`/models/${id}`),
}

// 模型路由规则 API
export const modelRoutingApi = {
  getAll: () =>
    api.get('/models/routing'),

  create: (data: {
    name: string
    agentType?: string
    taskType?: string
    keywords?: string[]
    modelId: string
    enabled?: boolean
  }) =>
    api.post('/models/routing', data),

  update: (id: string, data: Partial<{
    name: string
    agentType: string
    taskType: string
    keywords: string[]
    modelId: string
    enabled: boolean
    priority: number
  }>) =>
    api.put(`/models/routing/${id}`, data),

  delete: (id: string) =>
    api.delete(`/models/routing/${id}`),
}

export default api
