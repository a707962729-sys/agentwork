/**
 * 记忆系统类型定义
 */

import { MemoryLevel, MemoryEntry, MemorySearchResult } from '../types.js';

/**
 * 记忆存储配置
 */
export interface MemoryStoreConfig {
  /** 数据库路径 */
  dbPath: string;
  /** 是否启用向量检索 */
  enableVectorSearch?: boolean;
  /** 向量维度 (用于相似度计算) */
  vectorDimensions?: number;
}

/**
 * 存储选项
 */
export interface StoreOptions {
  /** 项目 ID (project/task 级别需要) */
  projectId?: string;
  /** 任务 ID (task 级别需要) */
  taskId?: string;
  /** 会话 ID (session 级别需要) */
  sessionId?: string;
  /** 元数据 */
  metadata?: Record<string, any>;
  /** 向量嵌入 (可选) */
  embedding?: number[];
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 记忆级别过滤 */
  levels?: MemoryLevel[];
  /** 项目 ID 过滤 */
  projectId?: string;
  /** 任务 ID 过滤 */
  taskId?: string;
  /** 会话 ID 过滤 */
  sessionId?: string;
  /** 最大结果数 */
  limit?: number;
  /** 最小相似度分数 */
  minScore?: number;
  /** 时间范围 */
  startTime?: Date;
  endTime?: Date;
  /** 是否使用向量检索 */
  useVectorSearch?: boolean;
}

/**
 * 自动回忆上下文
 */
export interface RecallContext {
  /** 当前任务 ID */
  taskId?: string;
  /** 当前项目 ID */
  projectId?: string;
  /** 当前会话 ID */
  sessionId?: string;
  /** 查询文本 */
  query: string;
  /** 上下文关键词 */
  keywords?: string[];
}

/**
 * 记忆管理器接口
 */
export interface MemoryManager {
  /**
   * 存储记忆
   * @param level 记忆级别
   * @param content 记忆内容
   * @param options 存储选项
   */
  store(level: MemoryLevel, content: string, options?: StoreOptions): Promise<MemoryEntry>;

  /**
   * 搜索记忆
   * @param query 搜索查询
   * @param options 搜索选项
   */
  search(query: string, options?: SearchOptions): Promise<MemorySearchResult[]>;

  /**
   * 自动回忆相关内容
   * @param context 回忆上下文
   */
  autoRecall(context: RecallContext): Promise<MemorySearchResult[]>;

  /**
   * 获取记忆条目
   * @param id 记忆 ID
   */
  get(id: string): Promise<MemoryEntry | null>;

  /**
   * 删除记忆
   * @param id 记忆 ID
   */
  delete(id: string): Promise<void>;

  /**
   * 更新记忆
   * @param id 记忆 ID
   * @param content 新内容
   */
  update(id: string, content: string): Promise<MemoryEntry>;

  /**
   * 列出记忆
   * @param options 列表选项
   */
  list(options?: Omit<SearchOptions, 'limit'>): Promise<MemoryEntry[]>;

  /**
   * 关闭数据库连接
   */
  close(): void;
}

/**
 * 向量相似度计算结果
 */
export interface VectorSimilarityResult {
  entryId: string;
  score: number;
}
