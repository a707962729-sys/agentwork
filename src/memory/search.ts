/**
 * 记忆搜索与检索
 * 支持关键词搜索和向量相似度检索
 */

import { MemoryEntry, MemorySearchResult } from '../types.js';
import { SearchOptions, RecallContext, VectorSimilarityResult } from './types.js';
import { MemoryStore } from './store.js';
import { createEmbedder, createVectorSearch } from '../vector/index.js';
import type { Embedder, VectorSearch as VectorSearchInterface } from '../vector/index.js';
import { Logger } from '../logging/index.js';

/**
 * 记忆搜索类
 */
export class MemorySearch {
  private store: MemoryStore;
  private embedder: Embedder | null = null;
  private vectorSearchClient: VectorSearchInterface | null = null;
  private enableVectorSearch: boolean;
  private logger = new Logger();

  constructor(store: MemoryStore, enableVectorSearch: boolean = false, openaiApiKey?: string) {
    this.store = store;
    this.enableVectorSearch = enableVectorSearch;

    // 如果启用了向量检索，初始化 embedder 和 vector search
    if (enableVectorSearch && openaiApiKey) {
      this.embedder = createEmbedder({
        provider: 'openai',
        apiKey: openaiApiKey,
        model: 'text-embedding-3-small',
        dimensions: 1536
      });

      // 注意：这里需要一个 VectorStore 实例，实际使用时需要传入或创建
      // 为简化集成，这里使用简化的实现
      this.vectorSearchClient = null; // 将在后续版本中完善
    }
  }

  /**
   * 搜索记忆
   * 支持关键词匹配和向量相似度
   */
  async search(query: string, options?: SearchOptions): Promise<MemorySearchResult[]> {
    // 获取候选记忆
    const memories = await this.store.list({
      levels: options?.levels,
      projectId: options?.projectId,
      taskId: options?.taskId,
      sessionId: options?.sessionId,
      startTime: options?.startTime,
      endTime: options?.endTime
    });

    if (memories.length === 0) {
      return [];
    }

    let results: MemorySearchResult[];

    // 如果启用了向量检索且有嵌入数据，使用向量相似度
    if (options?.useVectorSearch && memories.some(m => m.embedding)) {
      results = await this.vectorSearchInternal(query, memories, options);
    } else {
      // 否则使用关键词匹配
      results = this.keywordSearch(query, memories, options);
    }

    // 应用过滤和限制
    if (options?.minScore !== undefined) {
      results = results.filter(r => r.score >= options.minScore!);
    }

    const limit = options?.limit ?? 10;
    return results.slice(0, limit);
  }

  /**
   * 自动回忆相关内容
   * 基于上下文自动检索相关记忆
   */
  async autoRecall(context: RecallContext): Promise<MemorySearchResult[]> {
    const searchOptions: SearchOptions = {
      limit: 20,
      minScore: 0.3
    };

    // 根据上下文设置过滤
    if (context.taskId) {
      searchOptions.taskId = context.taskId;
    }

    if (context.projectId) {
      searchOptions.projectId = context.projectId;
    }

    if (context.sessionId) {
      searchOptions.sessionId = context.sessionId;
    }

    // 构建搜索查询
    let query = context.query;
    if (context.keywords && context.keywords.length > 0) {
      query = `${query} ${context.keywords.join(' ')}`;
    }

    // 执行搜索
    const results = await this.search(query, searchOptions);

    // 优先返回高级别记忆
    const levelPriority: Record<string, number> = {
      'global': 4,
      'project': 3,
      'task': 2,
      'session': 1
    };

    results.sort((a, b) => {
      // 先按分数排序
      if (Math.abs(a.score - b.score) > 0.1) {
        return b.score - a.score;
      }
      // 分数相近时按级别优先级排序
      const priorityA = levelPriority[a.entry.level] || 0;
      const priorityB = levelPriority[b.entry.level] || 0;
      return priorityB - priorityA;
    });

    return results.slice(0, 10);
  }

  /**
   * 关键词搜索
   * 使用 TF-IDF 风格的简单评分
   */
  private keywordSearch(
    query: string,
    memories: MemoryEntry[],
    options?: SearchOptions
  ): MemorySearchResult[] {
    const queryTerms = this.tokenize(query);
    
    const results: MemorySearchResult[] = memories.map(memory => {
      const score = this.calculateKeywordScore(queryTerms, memory.content);
      return {
        entry: memory,
        score
      };
    });

    // 按分数降序排序
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * 向量搜索（内部实现）
   * 计算余弦相似度
   */
  private async vectorSearchInternal(
    query: string,
    memories: MemoryEntry[],
    options?: SearchOptions
  ): Promise<MemorySearchResult[]> {
    // 如果没有初始化 embedder，降级到关键词搜索
    if (!this.embedder) {
      return this.keywordSearch(query, memories, options);
    }

    try {
      // 使用 OpenAI embedder 生成查询向量
      const queryEmbedding = await this.embedder.embed(query);
      
      const results: MemorySearchResult[] = memories
        .filter(m => m.embedding && m.embedding.length > 0)
        .map(memory => {
          const score = this.cosineSimilarity(queryEmbedding, memory.embedding!);
          return {
            entry: memory,
            score
          };
        });

      results.sort((a, b) => b.score - a.score);
      return results;
    } catch (error) {
      this.logger.warn(`Vector search failed, falling back to keyword search: ${error instanceof Error ? error.message : error}`);
      return this.keywordSearch(query, memories, options);
    }
  }

  /**
   * 计算余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 计算关键词匹配分数
   */
  private calculateKeywordScore(terms: string[], content: string): number {
    const contentLower = content.toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (contentLower.includes(term)) {
        score += 1;
      }
    }

    // 归一化到 0-1 范围
    return terms.length > 0 ? score / terms.length : 0;
  }

  /**
   * 文本分词
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2); // 过滤掉太短的词
  }

  /**
   * 简单的文本哈希
   */
  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
