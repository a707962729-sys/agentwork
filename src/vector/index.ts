/**
 * 向量检索模块入口
 * 
 * 提供完整的向量检索能力，包括：
 * - 文本向量化 (OpenAI / 本地模型)
 * - 向量存储 (SQLite)
 * - 相似度搜索 (余弦/欧几里得/点积)
 */

// 类型导出
export type {
  Embedder,
  EmbedderConfig,
  VectorEntry,
  VectorStoreConfig,
  StoreOptions,
  SearchResult,
  SearchOptions as VectorSearchOptions,
  VectorSearch,
  DistanceMetric
} from './types.js';

// 从 types.js 导入类型供内部使用
import type { SearchOptions, DistanceMetric } from './types.js';

// Embedder 导出
export {
  OpenAIEmbedder,
  LocalEmbedder,
  createEmbedder
} from './embedder.js';

// VectorStore 导出
export { VectorStore } from './store.js';

// VectorSearch 导出
export {
  VectorSearchImpl,
  createVectorSearch
} from './search.js';

/**
 * 快速创建向量检索系统
 * 
 * @example
 * ```typescript
 * const vectorSystem = createVectorSystem({
 *   provider: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY,
 *   model: 'text-embedding-3-small',
 *   dbPath: '~/.agentwork/vector.db'
 * });
 * 
 * // 添加文本
 * await vectorSystem.add('这是示例文本', { category: 'example' });
 * 
 * // 搜索相似文本
 * const results = await vectorSystem.search('相关查询', {
 *   limit: 5,
 *   minScore: 0.7
 * });
 * ```
 */
export async function createVectorSystem(config: {
  provider: 'openai' | 'local';
  apiKey?: string;
  model?: string;
  dimensions?: number;
  dbPath: string;
  distanceMetric?: DistanceMetric;
}) {
  const { createEmbedder } = await import('./embedder.js');
  const { VectorStore } = await import('./store.js');
  const { createVectorSearch } = await import('./search.js');

  const embedder = createEmbedder({
    provider: config.provider,
    apiKey: config.apiKey,
    model: config.model,
    dimensions: config.dimensions
  });

  // 从 embedder 获取实际维度
  const dimensions = config.dimensions ?? (config.provider === 'openai' ? 1536 : 384);

  const store = new VectorStore({
    dbPath: config.dbPath,
    dimensions
  });

  const searchClient = createVectorSearch(
    embedder,
    store,
    config.distanceMetric
  );

  const result = {
    embedder,
    store,
    searchClient,

    /**
     * 添加文本到向量库
     */
    async add(text: string, metadata?: Record<string, any>) {
      const vector = await embedder.embed(text);
      return store.add(text, vector, { metadata });
    },

    /**
     * 批量添加文本
     */
    async addBatch(items: Array<{ text: string; metadata?: Record<string, any> }>) {
      const texts = items.map(item => item.text);
      const vectors = await embedder.embedBatch(texts);
      
      return store.addBatch(
        items.map((item, index) => ({
          text: item.text,
          vector: vectors[index],
          metadata: item.metadata
        }))
      );
    },

    /**
     * 搜索相似文本
     */
    async search(query: string, options?: SearchOptions) {
      return searchClient.search(query, options);
    },

    /**
     * 获取向量条目
     */
    async get(id: string) {
      return store.get(id);
    },

    /**
     * 删除向量条目
     */
    async delete(id: string) {
      return store.delete(id);
    },

    /**
     * 列出所有向量
     */
    async list(options?: {
      startTime?: Date;
      endTime?: Date;
      limit?: number;
      offset?: number;
    }) {
      return store.list(options);
    },

    /**
     * 获取向量数量
     */
    count() {
      return store.count();
    },

    /**
     * 清空向量库
     */
    clear() {
      store.clear();
    },

    /**
     * 关闭连接
     */
    close() {
      store.close();
    }
  };

  return result;
}
