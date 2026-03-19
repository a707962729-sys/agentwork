/**
 * 记忆管理器入口
 * 提供四层记忆架构的统一接口
 */

import { MemoryLevel, MemoryEntry, MemorySearchResult } from '../types.js';
import { MemoryStore } from './store.js';
import { MemorySearch } from './search.js';
import { MemoryManager, MemoryStoreConfig, StoreOptions, SearchOptions, RecallContext } from './types.js';
import { expandHome } from '../utils.js';

/**
 * 记忆管理器实现
 */
export class MemoryManagerImpl implements MemoryManager {
  private memoryStore: MemoryStore;
  private memorySearch: MemorySearch;
  private config: MemoryStoreConfig;

  constructor(config?: Partial<MemoryStoreConfig>, openaiApiKey?: string) {
    this.config = {
      dbPath: config?.dbPath || '~/.agentwork/data/memory.db',
      enableVectorSearch: config?.enableVectorSearch ?? false,
      vectorDimensions: config?.vectorDimensions ?? 1536
    };

    this.memoryStore = new MemoryStore(this.config, openaiApiKey);
    this.memorySearch = new MemorySearch(this.memoryStore, this.config.enableVectorSearch, openaiApiKey);
  }

  /**
   * 存储记忆
   * @param level 记忆级别
   * @param content 记忆内容
   * @param options 存储选项
   */
  async store(level: MemoryLevel, content: string, options?: StoreOptions): Promise<MemoryEntry> {
    // 验证级别所需的参数
    this.validateLevelParams(level, options);

    return await this.memoryStore.store(level, content, options);
  }

  /**
   * 搜索记忆
   * @param query 搜索查询
   * @param options 搜索选项
   */
  async search(query: string, options?: SearchOptions): Promise<MemorySearchResult[]> {
    return await this.memorySearch.search(query, options);
  }

  /**
   * 自动回忆相关内容
   * @param context 回忆上下文
   */
  async autoRecall(context: RecallContext): Promise<MemorySearchResult[]> {
    return await this.memorySearch.autoRecall(context);
  }

  /**
   * 获取记忆条目
   * @param id 记忆 ID
   */
  async get(id: string): Promise<MemoryEntry | null> {
    return await this.memoryStore.get(id);
  }

  /**
   * 删除记忆
   * @param id 记忆 ID
   */
  async delete(id: string): Promise<void> {
    await this.memoryStore.delete(id);
  }

  /**
   * 更新记忆
   * @param id 记忆 ID
   * @param content 新内容
   */
  async update(id: string, content: string): Promise<MemoryEntry> {
    return await this.memoryStore.update(id, content);
  }

  /**
   * 列出记忆
   * @param options 列表选项
   */
  async list(options?: Omit<SearchOptions, 'limit'>): Promise<MemoryEntry[]> {
    return await this.memoryStore.list({
      levels: options?.levels,
      projectId: options?.projectId,
      taskId: options?.taskId,
      sessionId: options?.sessionId,
      startTime: options?.startTime,
      endTime: options?.endTime
    });
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.memoryStore.close();
  }

  /**
   * 验证级别参数
   */
  private validateLevelParams(level: MemoryLevel, options?: StoreOptions): void {
    switch (level) {
      case 'project':
        if (!options?.projectId) {
          throw new Error('Project memory requires projectId');
        }
        break;
      case 'task':
        if (!options?.taskId) {
          throw new Error('Task memory requires taskId');
        }
        break;
      case 'session':
        if (!options?.sessionId) {
          throw new Error('Session memory requires sessionId');
        }
        break;
      case 'global':
        // Global memory doesn't require any specific ID
        break;
    }
  }

  /**
   * 便捷方法：存储全局记忆
   */
  async storeGlobal(content: string, metadata?: Record<string, any>): Promise<MemoryEntry> {
    return this.store('global', content, { metadata });
  }

  /**
   * 便捷方法：存储项目记忆
   */
  async storeProject(
    projectId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<MemoryEntry> {
    return this.store('project', content, { projectId, metadata });
  }

  /**
   * 便捷方法：存储任务记忆
   */
  async storeTask(
    taskId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<MemoryEntry> {
    return this.store('task', content, { taskId, metadata });
  }

  /**
   * 便捷方法：存储会话记忆
   */
  async storeSession(
    sessionId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<MemoryEntry> {
    return this.store('session', content, { sessionId, metadata });
  }

  /**
   * 便捷方法：搜索项目记忆
   */
  async searchProject(projectId: string, query: string, limit?: number): Promise<MemorySearchResult[]> {
    return this.search(query, { projectId, limit });
  }

  /**
   * 便捷方法：搜索任务记忆
   */
  async searchTask(taskId: string, query: string, limit?: number): Promise<MemorySearchResult[]> {
    return this.search(query, { taskId, limit });
  }

  /**
   * 便捷方法：获取任务相关的所有记忆
   */
  async getTaskContext(taskId: string): Promise<MemorySearchResult[]> {
    // 获取任务记忆
    const taskMemories = await this.memorySearch.search('', {
      taskId,
      limit: 50
    });

    // 尝试获取关联的项目记忆
    if (taskMemories.length > 0 && taskMemories[0].entry.projectId) {
      const projectMemories = await this.memorySearch.search('', {
        projectId: taskMemories[0].entry.projectId,
        limit: 20
      });
      return [...projectMemories, ...taskMemories];
    }

    return taskMemories;
  }
}

// 默认实例
let defaultInstance: MemoryManagerImpl | null = null;

/**
 * 获取记忆管理器实例
 */
export async function getMemoryManager(config?: Partial<MemoryStoreConfig>, openaiApiKey?: string): Promise<MemoryManagerImpl> {
  if (!defaultInstance) {
    defaultInstance = new MemoryManagerImpl(config, openaiApiKey);
  }
  return defaultInstance;
}

// 导出类型
export * from './types.js';
