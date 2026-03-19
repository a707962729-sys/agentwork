/**
 * 向量检索类型定义
 */

/**
 * 向量嵌入接口
 */
export interface Embedder {
  /**
   * 将文本转换为向量
   * @param text 输入文本
   * @returns 向量数组
   */
  embed(text: string): Promise<number[]>;

  /**
   * 批量向量化
   * @param texts 文本数组
   * @returns 向量数组的数组
   */
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * 向量化配置
 */
export interface EmbedderConfig {
  /** 提供者类型 */
  provider: 'openai' | 'local';
  /** OpenAI API Key (使用 OpenAI 时需要) */
  apiKey?: string;
  /** 模型名称 */
  model?: string;
  /** 向量维度 */
  dimensions?: number;
}

/**
 * 向量存储条目
 */
export interface VectorEntry {
  /** 条目 ID */
  id: string;
  /** 向量数据 */
  vector: number[];
  /** 关联的文本内容 */
  text: string;
  /** 元数据 */
  metadata?: Record<string, any>;
  /** 创建时间戳 */
  createdAt: number;
}

/**
 * 向量存储配置
 */
export interface VectorStoreConfig {
  /** 数据库路径 */
  dbPath: string;
  /** 向量维度 */
  dimensions: number;
}

/**
 * 存储选项
 */
export interface StoreOptions {
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** 条目 ID */
  id: string;
  /** 文本内容 */
  text: string;
  /** 相似度分数 (0-1) */
  score: number;
  /** 元数据 */
  metadata?: Record<string, any>;
  /** 完整的向量 (可选) */
  vector?: number[];
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 最大结果数 */
  limit?: number;
  /** 最小相似度分数 */
  minScore?: number;
  /** 元数据过滤 */
  metadataFilter?: Record<string, any>;
  /** 是否返回向量数据 */
  includeVector?: boolean;
}

/**
 * 向量搜索接口
 */
export interface VectorSearch {
  /**
   * 搜索相似的向量
   * @param query 查询文本
   * @param options 搜索选项
   * @returns 搜索结果
   */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /**
   * 计算两个向量的相似度
   * @param vec1 向量 1
   * @param vec2 向量 2
   * @returns 相似度分数 (0-1)
   */
  similarity(vec1: number[], vec2: number[]): number;
}

/**
 * 距离度量类型
 */
export type DistanceMetric = 'cosine' | 'euclidean' | 'dot_product';
