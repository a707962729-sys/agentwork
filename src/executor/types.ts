/**
 * AgentWork Executor — 核心类型定义
 * 与架构文档 v1.0.0 一致
 */

// ============ 核心枚举 ============

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AgentStatus = 'idle' | 'running' | 'error';
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
export type ModelType = 'openai' | 'anthropic' | 'openai-compatible';

// ============ JSON Schema (用于工具参数) ============

export interface JSONSchema {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
  description?: string;
  enum?: any[];
  additionalProperties?: boolean;
}

// ============ Agent 配置 ============

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  model: string;
  modelType: ModelType;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools: string[];
  skills: string[];
  experienceId?: string;
  concurrentLimit: number;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
}

// ============ 任务输入/输出 ============

export interface TaskInput {
  type: 'text' | 'json' | 'file';
  content: string | object;
  context?: Record<string, any>;
}

export interface TaskOutput {
  type: 'text' | 'json' | 'file' | 'asset';
  content: string | object;
  assets?: WorkAsset[];
  usage?: LLMUsage;
}

// ============ 任务 ============

export interface Task {
  id: string;
  agentId: string;
  sessionId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  input: TaskInput;
  output?: TaskOutput;
  result?: any;
  error?: string;
  progress?: number;
  retryCount: number;
  maxRetries: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ 会话 ============

export interface SessionContext {
  recentMessages: Message[];
  currentTask?: string;
  toolHistory: ToolCall[];
  variables: Record<string, any>;
}

export interface Session {
  id: string;
  agentId: string;
  taskId?: string;
  status: 'active' | 'archived';
  context: SessionContext;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ 消息 ============

export interface Attachment {
  type: 'image' | 'file' | 'code';
  url?: string;
  path?: string;
  content?: string;
  mimeType?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  createdAt: string;
}

// ============ 定时任务 ============

export interface ScheduledTask {
  id: string;
  agentId: string;
  taskTemplate: Partial<TaskInput>;
  cron: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ 成果资产 ============

export interface WorkAsset {
  id: string;
  taskId: string;
  sessionId: string;
  agentId: string;
  type: 'file' | 'image' | 'code' | 'data' | 'report';
  name: string;
  path: string;
  size?: number;
  mimeType?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ============ LLM 相关 ============

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | object;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface LLMResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: 'assistant';
      content: string | null;
      toolCalls?: ToolCall[];
    };
    finishReason: 'stop' | 'tool_calls' | 'length';
  }[];
  usage?: LLMUsage;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ============ 工具定义 ============

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters?: JSONSchema;
  handler: ToolHandler;
  enabled: boolean;
  selfRegister?: boolean;
}

export type ToolHandler = (
  params: any,
  context: ToolContext
) => Promise<ToolResult>;

export interface ToolContext {
  sessionId: string;
  taskId: string;
  agentId: string;
  variables: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  output?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// ============ 经验包 ============

export interface ExperienceFile {
  path: string;
  type: 'system-prompt' | 'context' | 'template' | 'data';
  content: string;
}

export interface ExperiencePackage {
  id: string;
  agentId: string;
  version: string;
  files: ExperienceFile[];
  metadata: {
    author?: string;
    description?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
  };
}

// ============ Skill ============

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  location: string;
  tools: ToolDefinition[];
  enabled: boolean;
}

// ============ 执行器状态 ============

export interface ExecutorState {
  running: boolean;
  tasksProcessed: number;
  tasksSucceeded: number;
  tasksFailed: number;
  activeSessions: number;
  lastHeartbeat: string;
}
