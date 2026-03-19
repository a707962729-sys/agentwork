/**
 * AgentWork 类型定义
 */

// ==================== 任务相关 ====================

export type TaskType = 'content' | 'dev' | 'analysis' | 'operation' | 'research' | 'custom';
export type TaskStatus = 'pending' | 'decomposing' | 'ready' | 'running' | 'paused' | 'completed' | 'failed';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: 'high' | 'normal' | 'low';
  workflowId?: string;
  workflowRunId?: string;
  steps: TaskStep[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface TaskStep {
  id: string;
  orderId: number;
  title: string;
  description?: string;
  skill: string;
  agent?: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  input?: Record<string, any>;
  output?: Record<string, any>;
  dependsOn: string[];
  checkpoint?: CheckpointConfig;
  checkpointResult?: CheckpointResult;
  retryCount: number;
  maxRetries: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// ==================== 工作流相关 ====================

export interface WorkflowDefinition {
  apiVersion: string;
  kind: 'Workflow';
  metadata: WorkflowMetadata;
  triggers?: WorkflowTrigger[];
  inputs?: Record<string, InputDefinition>;
  steps: WorkflowStep[];
  errorHandling?: ErrorHandling;
  outputs?: Record<string, string>;
}

export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  tags?: string[];
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook';
  cron?: string;
  path?: string;
}

export interface InputDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: any;
  description?: string;
  enum?: any[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  agent?: string;
  skill: string;
  input?: Record<string, any>;
  dependsOn?: string[];
  checkpoint?: CheckpointConfig;
  condition?: string;
  retry?: number;
  timeout?: number;
}

export interface CheckpointConfig {
  validate?: string;
  aiValidate?: string;
  requireApproval?: boolean;
  onError?: 'retry' | 'skip' | 'abort' | string;
  maxRetries?: number;
  onReject?: {
    goto?: string;
    message?: string;
  };
  timeout?: number;
}

export interface CheckpointResult {
  passed: boolean;
  requireApproval: boolean;
  approved?: boolean;
  message?: string;
  validatedAt: Date;
}

export interface ErrorHandling {
  defaultAction: 'retry' | 'skip' | 'abort' | 'notify_user';
  notifyChannels?: string[];
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: TaskStatus;
  inputs: Record<string, any>;
  steps: TaskStep[];
  currentStepId?: string;
  outputs?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// ==================== 技能相关 ====================

export interface SkillManifest {
  name: string;
  description: string;
  category?: string;
  triggers?: string[];
  author?: string;
  version?: string;
  requires?: string[];
}

export interface Skill {
  path: string;
  manifest: SkillManifest;
  content: string;
}

// ==================== Agent 相关 ====================

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  model?: string;
  skills?: string[];
  tools?: {
    allow?: string[];
    deny?: string[];
  };
  persona?: {
    tone?: string;
    style?: string;
    expertise?: string[];
  };
}

// ==================== 记忆相关 ====================

export type MemoryLevel = 'global' | 'project' | 'task' | 'session';

export interface MemoryEntry {
  id: string;
  level: MemoryLevel;
  projectId?: string;
  taskId?: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  createdAt: Date;
}

export interface MemorySearchResult {
  entry: MemoryEntry;
  score: number;
}

// ==================== 事件相关 ====================

export type EventType = 
  | 'task:created'
  | 'task:started'
  | 'task:completed'
  | 'task:failed'
  | 'step:started'
  | 'step:completed'
  | 'step:failed'
  | 'checkpoint:passed'
  | 'checkpoint:failed'
  | 'checkpoint:pending_approval'
  | 'workflow:started'
  | 'workflow:completed';

export interface Event {
  type: EventType;
  data: any;
  timestamp: Date;
}

export type EventHandler = (event: Event) => void | Promise<void>;