/**
 * Subagents 类型定义
 * 参考 Deep Agents 设计，支持 Context 隔离
 */

/**
 * 子代理定义
 */
export interface SubAgentDefinition {
  /** 唯一标识 */
  name: string;
  
  /** 描述 - 主代理用于决定何时委派 */
  description: string;
  
  /** 系统提示词 */
  systemPrompt: string;
  
  /** 可用工具列表 */
  tools?: string[];
  
  /** 可用技能路径 */
  skills?: string[];
  
  /** 模型覆盖 */
  model?: string;
  
  /** 最大迭代次数 */
  maxIterations?: number;
  
  /** 超时时间 (ms) */
  timeout?: number;
  
  /** 中间件 */
  middleware?: SubAgentMiddleware[];
  
  /** 人机交互配置 */
  interruptOn?: Record<string, boolean>;
}

/**
 * 编译后的子代理 - 使用预编译的 LangGraph 图
 */
export interface CompiledSubAgent {
  name: string;
  description: string;
  runnable: any; // Compiled LangGraph graph
}

/**
 * 子代理中间件
 */
export interface SubAgentMiddleware {
  name: string;
  beforeInvoke?: (context: SubAgentContext) => Promise<SubAgentContext>;
  afterInvoke?: (result: SubAgentResult) => Promise<SubAgentResult>;
  onError?: (error: Error, context: SubAgentContext) => Promise<void>;
}

/**
 * 子代理执行上下文
 */
export interface SubAgentContext {
  /** 子代理名称 */
  agentName: string;
  
  /** 父代理上下文 */
  parentContext?: Record<string, any>;
  
  /** 子代理专属上下文 */
  subagentContext?: Record<string, any>;
  
  /** 消息历史 */
  messages: SubAgentMessage[];
  
  /** 技能状态 */
  skillsState: Map<string, any>;
  
  /** 工具调用记录 */
  toolCalls: ToolCallRecord[];
  
  /** 元数据 */
  metadata: Record<string, any>;
}

/**
 * 子代理消息
 */
export interface SubAgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  timestamp: Date;
}

/**
 * 工具调用记录
 */
export interface ToolCallRecord {
  id: string;
  name: string;
  args: Record<string, any>;
  result?: any;
  error?: string;
  timestamp: Date;
}

/**
 * 子代理执行结果
 */
export interface SubAgentResult {
  /** 是否成功 */
  success: boolean;
  
  /** 最终输出 */
  output: string;
  
  /** 结构化输出 */
  structuredOutput?: Record<string, any>;
  
  /** 执行统计 */
  stats: {
    iterations: number;
    toolCalls: number;
    tokensUsed: number;
    durationMs: number;
  };
  
  /** 错误信息 */
  error?: string;
  
  /** 元数据 */
  metadata: {
    agentName: string;
    lcAgentName: string;
    startedAt: Date;
    completedAt: Date;
  };
}

/**
 * 通用子代理配置 (继承主代理能力)
 */
export interface GeneralPurposeSubAgentConfig {
  /** 是否启用 */
  enabled: boolean;
  
  /** 模型覆盖 */
  model?: string;
  
  /** 系统提示词覆盖 */
  systemPrompt?: string;
  
  /** 额外工具 */
  additionalTools?: string[];
}

/**
 * 子代理管理器配置
 */
export interface SubAgentManagerConfig {
  /** 自定义子代理列表 */
  subagents: SubAgentDefinition[];
  
  /** 通用子代理配置 */
  generalPurpose?: GeneralPurposeSubAgentConfig;
  
  /** 默认超时 */
  defaultTimeout?: number;
  
  /** 默认最大迭代 */
  defaultMaxIterations?: number;
}