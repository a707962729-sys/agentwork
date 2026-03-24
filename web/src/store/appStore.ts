import { create } from 'zustand'

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  progress: number
  steps: TaskStep[]
  createdAt: string
  updatedAt: string
}

interface TaskStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  output?: string
}

interface Agent {
  id: string
  name: string
  status: 'idle' | 'busy' | 'offline'
  currentTask?: string
  lastActive: string
}

interface Skill {
  id: string
  name: string
  description: string
  version: string
  installed: boolean
  location?: string
}

interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  status: 'active' | 'inactive'
}

interface WorkflowStep {
  id: string
  name: string
  type: string
  config: Record<string, any>
}

interface AppState {
  // 任务
  tasks: Task[]
  currentTask: Task | null
  setTasks: (tasks: Task[]) => void
  updateTask: (task: Task) => void
  setCurrentTask: (task: Task | null) => void
  
  // Agent
  agents: Agent[]
  setAgents: (agents: Agent[]) => void
  updateAgent: (agent: Agent) => void
  
  // 技能
  skills: Skill[]
  setSkills: (skills: Skill[]) => void
  
  // 工作流
  workflows: Workflow[]
  setWorkflows: (workflows: Workflow[]) => void
  
  // UI
  darkMode: boolean
  toggleDarkMode: () => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  
  // 通知
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
}

export const useAppStore = create<AppState>((set, get) => ({
  // 任务状态
  tasks: [],
  currentTask: null,
  setTasks: (tasks) => set({ tasks }),
  updateTask: (task) => {
    const tasks = get().tasks.map(t => t.id === task.id ? task : t)
    set({ tasks })
    const currentTask = get().currentTask
    if (currentTask?.id === task.id) {
      set({ currentTask: task })
    }
  },
  setCurrentTask: (task) => set({ currentTask: task }),
  
  // Agent 状态
  agents: [],
  setAgents: (agents) => set({ agents }),
  updateAgent: (agent) => {
    const agents = get().agents.map(a => a.id === agent.id ? agent : a)
    set({ agents })
  },
  
  // 技能状态
  skills: [],
  setSkills: (skills) => set({ skills }),
  
  // 工作流状态
  workflows: [],
  setWorkflows: (workflows) => set({ workflows }),
  
  // UI 状态
  darkMode: true,
  toggleDarkMode: () => {
    const darkMode = !get().darkMode
    set({ darkMode })
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
  sidebarOpen: true,
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  
  // 通知
  notifications: [],
  addNotification: (notification) => {
    const notifications = [...get().notifications, { ...notification, id: Math.random().toString(36).substr(2, 9) }]
    set({ notifications })
    // 5 秒后自动移除
    setTimeout(() => {
      get().removeNotification(notifications[notifications.length - 1].id)
    }, 5000)
  },
  removeNotification: (id) => {
    set({ notifications: get().notifications.filter(n => n.id !== id) })
  },
}))
