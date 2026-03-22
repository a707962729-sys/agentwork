/**
 * Context Engineering 类型定义
 * 
 * 管理上下文窗口，防止 context bloat
 */

import type { Message } from '../ai/types.js';

/**
 * 上下文消息 (扩展 Message，增加元数据)
 */
export interface ContextMessage extends Message {
  /** 消息 ID */
  id?: string;
  /** 时间戳 */
  timestamp?: Date;
  /** 重要性分数 (0-1) */
  importance?: number;
  /** 消息标签 */
  tags?: string[];
  /** 是否已被压缩 */
  compacted?: boolean;
  /** 原始消息 ID 列表 (如果是压缩后的摘要) */
  originalIds?: string[];
}

/**
 * 压缩策略
 */
export type CompactionStrategy = 
  | 'summarize'      // AI 生成摘要
  | 'truncate'       // 截断旧消息
  | 'selective'      // 选择性保留关键信息
  | 'sliding-window' // 滑动窗口保留最近 N 条
  | 'importance';    // 按重要性过滤

/**
 * 压缩配置
 */
export interface CompactionConfig {
  /** 压缩策略 */
  strategy: CompactionStrategy;
  /** 触发压缩的消息数阈值 */
  threshold?: number;
  /** 压缩后保留的最小消息数 */
  minMessages?: number;
  /** AI 摘要提示词模板 */
  summaryPrompt?: string;
  /** 重要性过滤阈值 (0-1) */
  importanceThreshold?: number;
  /** 滑动窗口大小 */
  windowSize?: number;
  /** 是否保留系统消息 */
  keepSystemMessages?: boolean;
}

/**
 * 卸载存储后端类型
 */
export type OffloadStorageType = 'file' | 'sqlite' | 'memory';

/**
 * 卸载存储配置
 */
export interface OffloadConfig {
  /** 存储后端类型 */
  type: OffloadStorageType;
  /** 存储路径 (file/sqlite) */
  path?: string;
  /** 内存缓存最大条目数 (memory) */
  maxEntries?: number;
  /** 是否启用增量加载 */
  incrementalLoad?: boolean;
  /** 增量加载块大小 */
  chunkSize?: number;
}

/**
 * 卸载的状态条目
 */
export interface OffloadedState {
  /** 状态 ID */
  id: string;
  /** 状态键 */
  key: string;
  /** 状态数据 */
  data: any;
  /** 元数据 */
  metadata?: Record<string, any>;
  /** 创建时间 */
  createdAt: Date;
  /** 最后访问时间 */
  lastAccessedAt: Date;
  /** 访问次数 */
  accessCount: number;
  /** 数据大小 (字节) */
  size: number;
}

/**
 * 压缩结果
 */
export interface CompactionResult {
  /** 压缩后的消息列表 */
  messages: ContextMessage[];
  /** 被移除的消息数 */
  removedCount: number;
  /** 压缩比率 (原始 tokens / 压缩后 tokens) */
  compressionRatio?: number;
  /** 压缩摘要 (如果有) */
  summary?: string;
  /** 压缩耗时 (ms) */
  duration: number;
}

/**
 * 上下文统计信息
 */
export interface ContextStats {
  /** 总消息数 */
  totalMessages: number;
  /** 总 token 数 (估算) */
  estimatedTokens: number;
  /** 按角色统计 */
  byRole: Record<string, number>;
  /** 平均消息长度 */
  avgMessageLength: number;
  /** 系统消息数 */
  systemMessageCount: number;
  /** 最早消息时间 */
  oldestMessageTime?: Date;
  /** 最新消息时间 */
  newestMessageTime?: Date;
  /** 已压缩消息数 */
  compactedCount: number;
}

/**
 * 上下文管理器接口
 */
export interface ContextManager {
  /**
   * 检查是否需要压缩
   * @param messages 消息列表
   * @param config 压缩配置
   */
  shouldCompact(messages: ContextMessage[], config?: Partial<CompactionConfig>): boolean;

  /**
   * 压缩消息
   * @param messages 消息列表
   * @param config 压缩配置
   */
  compact(
    messages: ContextMessage[],
    config?: Partial<CompactionConfig>
  ): Promise<CompactionResult>;

  /**
   * 卸载状态
   * @param state 状态数据
   * @param key 状态键
   * @param metadata 元数据
   */
  offload(
    state: any,
    key?: string,
    metadata?: Record<string, any>
  ): Promise<string>;

  /**
   * 加载状态
   * @param key 状态键或 ID
   */
  load(key: string): Promise<any>;

  /**
   * 删除卸载的状态
   * @param key 状态键或 ID
   */
  delete(key: string): Promise<void>;

  /**
   * 列出所有卸载的状态
   */
  list(): Promise<OffloadedState[]>;

  /**
   * 获取上下文统计
   * @param messages 消息列表
   */
  getStats(messages: ContextMessage[]): ContextStats;
}

/**
 * AI 辅助压缩器接口
 */
export interface AICompactor {
  /**
   * 生成消息摘要
   * @param messages 要摘要的消息
   * @param prompt 自定义提示词
   */
  summarize(messages: ContextMessage[], prompt?: string): Promise<string>;

  /**
   * 提取关键信息
   * @param messages 消息列表
   */
  extractKeyInfo(messages: ContextMessage[]): Promise<string[]>;

  /**
   * 评估消息重要性
   * @param message 消息
   * @param context 上下文
   */
  evaluateImportance(message: ContextMessage, context: ContextMessage[]): Promise<number>;
}