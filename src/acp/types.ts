/**
 * ACP (Agent Client Protocol) 类型定义
 * 参考 https://agentclientprotocol.com
 */

/**
 * ACP 消息类型
 */
export type ACPMessageType = 
  | 'request'
  | 'response'
  | 'notification';

/**
 * ACP 请求
 */
export interface ACPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

/**
 * ACP 响应
 */
export interface ACPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: ACPError;
}

/**
 * ACP 错误
 */
export interface ACPError {
  code: number;
  message: string;
  data?: any;
}

/**
 * ACP 通知
 */
export interface ACPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, any>;
}

/**
 * ACP 会话
 */
export interface ACPSession {
  id: string;
  status: 'active' | 'idle' | 'closed';
  createdAt: Date;
  lastActivityAt: Date;
  messages: ACPMessage[];
}

/**
 * ACP 消息
 */
export interface ACPMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * ACP 能力
 */
export interface ACPCapabilities {
  streaming: boolean;
  tools: boolean;
  skills: boolean;
  subagents: boolean;
  memory: boolean;
}

/**
 * ACP 服务器配置
 */
export interface ACPServerConfig {
  /** 服务器名称 */
  name: string;
  
  /** 服务器版本 */
  version: string;
  
  /** 支持的能力 */
  capabilities: ACPCapabilities;
  
  /** 超时时间 (ms) */
  timeout?: number;
}

/**
 * ACP 工具定义
 */
export interface ACPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * ACP 技能定义
 */
export interface ACPSkill {
  name: string;
  description: string;
  triggers?: string[];
}

/**
 * ACP 子代理定义
 */
export interface ACPSubAgent {
  name: string;
  description: string;
}

/**
 * ACP 初始化结果
 */
export interface ACPInitializeResult {
  protocolVersion: string;
  capabilities: ACPCapabilities;
  serverInfo: {
    name: string;
    version: string;
  };
}

/**
 * ACP 任务状态
 */
export type ACPTaskStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * ACP 任务
 */
export interface ACPTask {
  id: string;
  status: ACPTaskStatus;
  progress?: number;
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}