/**
 * Context Engineering 模块入口
 * 
 * 管理上下文窗口，防止 context bloat
 */

import type { AIProvider } from '../ai/provider.js';
import {
  ContextMessage,
  CompactionConfig,
  CompactionResult,
  OffloadConfig,
  OffloadedState,
  ContextStats,
  ContextManager,
} from './types.js';
import { Compactor, createCompactor, DEFAULT_COMPACTION_CONFIG } from './compactor.js';
import { Offloader, createOffloader, DEFAULT_OFFLOAD_CONFIG } from './offloader.js';

// 导出类型
export * from './types.js';
export { Compactor, createCompactor, DEFAULT_COMPACTION_CONFIG } from './compactor.js';
export { Offloader, createOffloader, DEFAULT_OFFLOAD_CONFIG } from './offloader.js';

/**
 * 上下文管理器配置
 */
export interface ContextManagerConfig {
  /** 压缩配置 */
  compaction?: Partial<CompactionConfig>;
  /** 卸载配置 */
  offload?: Partial<OffloadConfig>;
}

/**
 * 默认配置
 */
const DEFAULT_CONTEXT_MANAGER_CONFIG: ContextManagerConfig = {
  compaction: DEFAULT_COMPACTION_CONFIG,
  offload: DEFAULT_OFFLOAD_CONFIG,
};

/**
 * 上下文管理器实现
 */
export class ContextManagerImpl implements ContextManager {
  private compactor: Compactor;
  private offloader: Offloader;
  private config: ContextManagerConfig;

  constructor(aiProvider?: AIProvider, config?: ContextManagerConfig) {
    this.config = { ...DEFAULT_CONTEXT_MANAGER_CONFIG, ...config };
    this.compactor = createCompactor(aiProvider);
    this.offloader = createOffloader(this.config.offload);
  }

  /**
   * 检查是否需要压缩
   */
  shouldCompact(
    messages: ContextMessage[],
    config?: Partial<CompactionConfig>
  ): boolean {
    return this.compactor.shouldCompact(messages, config);
  }

  /**
   * 压缩消息
   */
  async compact(
    messages: ContextMessage[],
    config?: Partial<CompactionConfig>
  ): Promise<CompactionResult> {
    return this.compactor.compact(messages, config);
  }

  /**
   * 卸载状态
   */
  async offload(
    state: any,
    key?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.offloader.offload(state, key, metadata);
  }

  /**
   * 加载状态
   */
  async load(key: string): Promise<any> {
    return this.offloader.load(key);
  }

  /**
   * 删除卸载的状态
   */
  async delete(key: string): Promise<void> {
    return this.offloader.delete(key);
  }

  /**
   * 列出所有卸载的状态
   */
  async list(): Promise<OffloadedState[]> {
    return this.offloader.list();
  }

  /**
   * 获取上下文统计
   */
  getStats(messages: ContextMessage[]): ContextStats {
    return this.compactor.getStats(messages);
  }

  /**
   * 增量加载状态
   */
  async loadIncremental(
    key: string,
    chunkSize?: number
  ): Promise<AsyncGenerator<any[], void, unknown>> {
    return this.offloader.loadIncremental(key, chunkSize);
  }

  /**
   * 清理过期状态
   */
  async cleanup(maxAgeMs: number): Promise<number> {
    return this.offloader.cleanup(maxAgeMs);
  }

  /**
   * 获取存储统计
   */
  async getStorageStats(): Promise<{
    totalCount: number;
    totalSize: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  }> {
    return this.offloader.getStats();
  }

  /**
   * 关闭资源
   */
  close(): void {
    this.offloader.close();
  }
}

/**
 * 创建上下文管理器实例
 */
export function createContextManager(
  aiProvider?: AIProvider,
  config?: ContextManagerConfig
): ContextManager {
  return new ContextManagerImpl(aiProvider, config);
}

/**
 * 快捷方法：创建简单的上下文管理器
 */
export function createSimpleContextManager(): ContextManager {
  return createContextManager();
}