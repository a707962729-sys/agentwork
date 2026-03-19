/**
 * 向量化实现
 * 支持 OpenAI Embeddings 和本地模型
 */

import { Embedder, EmbedderConfig } from './types.js';

/**
 * OpenAI Embedder 实现
 */
export class OpenAIEmbedder implements Embedder {
  private apiKey: string;
  private model: string;
  private dimensions: number;

  constructor(config: EmbedderConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.apiKey = config.apiKey;
    this.model = config.model ?? 'text-embedding-3-small';
    this.dimensions = config.dimensions ?? 1536; // text-embedding-3-small default
  }

  /**
   * 将文本转换为向量
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.createEmbedding(text);
    return response.data[0].embedding;
  }

  /**
   * 批量向量化
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    // OpenAI API 支持批量处理，最大批次数取决于模型
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.createEmbedding(batch);
      allEmbeddings.push(...response.data.map(item => item.embedding));
    }

    return allEmbeddings;
  }

  /**
   * 创建嵌入请求
   */
  private async createEmbedding(input: string | string[]): Promise<OpenAIEmbeddingResponse> {
    const url = 'https://api.openai.com/v1/embeddings';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        input,
        dimensions: this.dimensions
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    return response.json() as Promise<OpenAIEmbeddingResponse>;
  }
}

/**
 * 本地 Embedder 实现 (使用简化的哈希方法)
 * 生产环境应替换为实际的本地模型 (如 @xenova/transformers)
 */
export class LocalEmbedder implements Embedder {
  private dimensions: number;

  constructor(config: EmbedderConfig) {
    this.dimensions = config.dimensions ?? 384;
  }

  /**
   * 将文本转换为向量 (简化实现)
   * 注意：这只是演示用途，生产环境应使用真实的本地模型
   */
  async embed(text: string): Promise<number[]> {
    return this.generatePseudoEmbedding(text);
  }

  /**
   * 批量向量化
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.embed(text)));
  }

  /**
   * 生成伪向量 (基于文本哈希)
   * 仅用于演示，不具备实际语义相似度
   */
  private generatePseudoEmbedding(text: string): number[] {
    const embedding: number[] = [];
    const hash = this.simpleHash(text);

    for (let i = 0; i < this.dimensions; i++) {
      // 使用正弦函数生成伪随机但确定性的向量
      embedding.push(Math.sin(hash * (i + 1)));
    }

    // 归一化向量
    return this.normalize(embedding);
  }

  /**
   * 简单的文本哈希函数
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

  /**
   * 归一化向量
   */
  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }
}

/**
 * 创建 Embedder 实例
 */
export function createEmbedder(config: EmbedderConfig): Embedder {
  switch (config.provider) {
    case 'openai':
      return new OpenAIEmbedder(config);
    case 'local':
      return new LocalEmbedder(config);
    default:
      throw new Error(`Unknown embedder provider: ${config.provider}`);
  }
}

/**
 * OpenAI Embedding API 响应类型
 */
interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}
