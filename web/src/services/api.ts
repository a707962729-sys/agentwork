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

export default api
