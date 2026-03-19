/**
 * AI 调用适配层 - 类型定义
 */

/**
 * 消息角色
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * 对话消息
 */
export interface Message {
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
}

/**
 * 工具调用请求
 */
export interface ToolCallRequest {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * 工具调用结果
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  content?: string;
}

/**
 * 工具定义
 */
export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description?: string;
        enum?: any[];
      }>;
      required?: string[];
    };
  };
}

/**
 * 对话选项
 */
export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}

/**
 * Provider 配置
 */
export interface ProviderConfig {
  name: string;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  [key: string]: any;
}

/**
 * 嵌入向量结果
 */
export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}
