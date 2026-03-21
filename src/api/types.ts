// API 类型定义

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: 'high' | 'normal' | 'low';
  workflowId?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TaskDetail extends TaskItem {
  steps: TaskStepItem[];
  result?: any;
  error?: string;
}

export interface TaskStepItem {
  id: string;
  orderId: number;
  title: string;
  description?: string;
  skill: string;
  agent?: string;
  status: string;
  input?: Record<string, any>;
  output?: Record<string, any>;
  dependsOn: string[];
  retryCount: number;
  maxRetries: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface StatsResponse {
  tasks: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    pending: number;
  };
  outputs: {
    totalArticles: number;
    totalImages: number;
    totalFiles: number;
  };
  agentUsage: {
    activeAgents: number;
    tasksPerAgent: Record<string, number>;
  };
}

export interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  agents: WorkflowAgent[];
  steps: WorkflowStepItem[];
  createdAt: string;
  enabled: boolean;
}

export interface WorkflowAgent {
  id: string;
  type: string;
  trigger: string;
}

export interface WorkflowStepItem {
  id: string;
  name: string;
  agent: string;
  auto: boolean;
}

export interface WorkflowRunResponse {
  runId: string;
  status: string;
  startedAt?: string;
}

export interface RunWorkflowRequest {
  inputs?: Record<string, any>;
}

// Express Request extensions
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
}
