/**
 * 向量搜索实现
 * 支持余弦相似度和其他距离度量
 */

import { Embedder } from './types.js';
import { VectorStore } from './store.js';
import { VectorSearch, SearchOptions, SearchResult, DistanceMetric } from './types.js';

/**
 * 向量搜索类
 */
export class VectorSearchImpl implements VectorSearch {
  private embedder: Embedder;
  private store: VectorStore;
  private distanceMetric: DistanceMetric;

  constructor(
    embedder: Embedder,
    store: VectorStore,
    distanceMetric: DistanceMetric = 'cosine'
  ) {
    this.embedder = embedder;
    this.store = store;
    this.distanceMetric = distanceMetric;
  }

  /**
   * 搜索相似的向量
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    // 将查询文本转换为向量
    const queryVector = await this.embedder.embed(query);

    // 获取所有向量
    const allVectors = await this.store.list();

    if (allVectors.length === 0) {
      return [];
    }

    // 计算相似度分数
    const results: SearchResult[] = allVectors.map(entry => {
      const score = this.similarity(queryVector, entry.vector);
      return {
        id: entry.id,
        text: entry.text,
        score,
        metadata: entry.metadata,
        vector: options?.includeVector ? entry.vector : undefined
      };
    });

    // 应用元数据过滤
    if (options?.metadataFilter) {
      const filter = options.metadataFilter;
      return results.filter(result => {
        if (!result.metadata) return false;
        return Object.entries(filter).every(([key, value]) => {
          return result.metadata?.[key] === value;
        });
      });
    }

    // 按分数降序排序
    results.sort((a, b) => b.score - a.score);

    // 应用最小分数过滤
    if (options?.minScore !== undefined) {
      return results.filter(r => r.score >= options.minScore!);
    }

    // 应用结果数量限制
    const limit = options?.limit ?? 10;
    return results.slice(0, limit);
  }

  /**
   * 计算两个向量的相似度
   */
  similarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vector dimensions must match');
    }

    switch (this.distanceMetric) {
      case 'cosine':
        return this.cosineSimilarity(vec1, vec2);
      case 'euclidean':
        return this.euclideanSimilarity(vec1, vec2);
      case 'dot_product':
        return this.dotProductSimilarity(vec1, vec2);
      default:
        throw new Error(`Unknown distance metric: ${this.distanceMetric}`);
    }
  }

  /**
   * 余弦相似度
   * 范围：0-1 (1 表示完全相同)
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    // 归一化到 0-1 范围 (余弦相似度范围是 -1 到 1)
    return (similarity + 1) / 2;
  }

  /**
   * 欧几里得相似度
   * 基于欧几里得距离转换为相似度
   * 范围：0-1 (1 表示完全相同)
   */
  private euclideanSimilarity(vec1: number[], vec2: number[]): number {
    let sumSquaredDiff = 0;

    for (let i = 0; i < vec1.length; i++) {
      const diff = vec1[i] - vec2[i];
      sumSquaredDiff += diff * diff;
    }

    const distance = Math.sqrt(sumSquaredDiff);
    // 将距离转换为相似度 (使用高斯核)
    return Math.exp(-distance);
  }

  /**
   * 点积相似度
   * 范围：取决于向量大小，需要归一化
   */
  private dotProductSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }

    // 归一化到 0-1 范围 (假设输入向量已归一化)
    return (dotProduct + 1) / 2;
  }
}

/**
 * 创建向量搜索实例
 */
export function createVectorSearch(
  embedder: Embedder,
  store: VectorStore,
  distanceMetric?: DistanceMetric
): VectorSearch {
  return new VectorSearchImpl(embedder, store, distanceMetric);
}
