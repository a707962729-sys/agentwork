/**
 * AI 记忆管理
 */

import type { Message } from './types';

/**
 * 记忆项
 */
export interface MemoryItem {
  id: string;
  content: string;
  embedding?: number[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * 记忆存储接口
 */
export interface MemoryStore {
  add(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryItem>;
  get(id: string): Promise<MemoryItem | null>;
  search(query: string, limit?: number): Promise<MemoryItem[]>;
  searchByEmbedding(embedding: number[], limit?: number): Promise<MemoryItem[]>;
  delete(id: string): Promise<void>;
  list(limit?: number): Promise<MemoryItem[]>;
}

/**
 * 内存存储实现 (简单版本)
 */
export class InMemoryStore implements MemoryStore {
  private items: Map<string, MemoryItem> = new Map();
  private embeddings: Array<{ id: string; embedding: number[] }> = [];

  async add(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryItem> {
    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = Date.now();
    
    const memoryItem: MemoryItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(id, memoryItem);
    
    if (item.embedding) {
      this.embeddings.push({ id, embedding: item.embedding });
    }

    return memoryItem;
  }

  async get(id: string): Promise<MemoryItem | null> {
    return this.items.get(id) || null;
  }

  async search(query: string, limit: number = 10): Promise<MemoryItem[]> {
    // 简单文本搜索
    const results: MemoryItem[] = [];
    const queryLower = query.toLowerCase();

    for (const item of this.items.values()) {
      if (item.content.toLowerCase().includes(queryLower)) {
        results.push(item);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  async searchByEmbedding(embedding: number[], limit: number = 10): Promise<MemoryItem[]> {
    if (this.embeddings.length === 0) {
      return [];
    }

    // 计算余弦相似度
    const similarities = this.embeddings.map(({ id, embedding: emb }) => ({
      id,
      similarity: cosineSimilarity(embedding, emb),
    }));

    // 排序并返回最相似的结果
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    const results: MemoryItem[] = [];
    for (let i = 0; i < Math.min(limit, similarities.length); i++) {
      const item = this.items.get(similarities[i].id);
      if (item) {
        results.push(item);
      }
    }

    return results;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
    this.embeddings = this.embeddings.filter(e => e.id !== id);
  }

  async list(limit: number = 100): Promise<MemoryItem[]> {
    return Array.from(this.items.values()).slice(0, limit);
  }
}

/**
 * 余弦相似度计算
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * 记忆管理器
 */
export class MemoryManager {
  private store: MemoryStore;
  private conversationHistory: Message[] = [];
  private maxHistoryLength: number;

  constructor(store?: MemoryStore, maxHistoryLength: number = 50) {
    this.store = store || new InMemoryStore();
    this.maxHistoryLength = maxHistoryLength;
  }

  /**
   * 添加消息到对话历史
   */
  addMessage(message: Message): void {
    this.conversationHistory.push(message);
    
    // 限制历史长度
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
  }

  /**
   * 获取对话历史
   */
  getHistory(): Message[] {
    return this.conversationHistory;
  }

  /**
   * 清空对话历史
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * 保存重要记忆
   */
  async saveMemory(
    content: string,
    embedding?: number[],
    tags?: string[],
    metadata?: Record<string, any>
  ): Promise<MemoryItem> {
    return this.store.add({
      content,
      embedding,
      tags,
      metadata,
    });
  }

  /**
   * 搜索记忆
   */
  async searchMemory(query: string, limit?: number): Promise<MemoryItem[]> {
    return this.store.search(query, limit);
  }

  /**
   * 通过向量搜索记忆
   */
  async searchByEmbedding(embedding: number[], limit?: number): Promise<MemoryItem[]> {
    return this.store.searchByEmbedding(embedding, limit);
  }

  /**
   * 删除记忆
   */
  async deleteMemory(id: string): Promise<void> {
    return this.store.delete(id);
  }

  /**
   * 获取所有记忆
   */
  async listMemories(limit?: number): Promise<MemoryItem[]> {
    return this.store.list(limit);
  }

  /**
   * 获取上下文消息 (历史 + 相关记忆)
   */
  async getContextMessages(
    query?: string,
    memoryLimit: number = 5
  ): Promise<Message[]> {
    const messages = [...this.conversationHistory];

    if (query) {
      const memories = await this.searchMemory(query, memoryLimit);
      const memoryMessages: Message[] = memories.map(mem => ({
        role: 'system' as const,
        content: `[Memory] ${mem.content}`,
      }));
      
      // 在历史消息前插入相关记忆
      messages.unshift(...memoryMessages);
    }

    return messages;
  }
}
