# 向量检索模块

为 AgentWork 记忆系统提供向量检索能力，支持语义相似度搜索。

## 功能特性

- ✅ **多种 Embedding 提供者**: OpenAI / 本地模型
- ✅ **向量存储**: 基于 SQLite 的高效存储
- ✅ **相似度搜索**: 余弦/欧几里得/点积距离度量
- ✅ **记忆系统集成**: 无缝集成到现有记忆系统
- ✅ **混合搜索**: 关键词 + 向量相似度

## 快速开始

### 1. 基础使用

```typescript
import { createVectorSystem } from './vector/index.js';

// 创建向量检索系统
const vectorSystem = await createVectorSystem({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'text-embedding-3-small',
  dbPath: '~/.agentwork/data/vector.db'
});

// 添加文本
await vectorSystem.add('TypeScript 是一种强类型编程语言', {
  category: 'programming'
});

// 搜索相似文本
const results = await vectorSystem.search('哪种语言适合 Web 开发', {
  limit: 5,
  minScore: 0.7
});

results.forEach(r => {
  console.log(`[${r.score.toFixed(3)}] ${r.text}`);
});

// 关闭连接
vectorSystem.close();
```

### 2. 记忆系统集成

```typescript
import { getMemoryManager } from './memory/index.js';

// 启用向量检索的记忆管理器
const memoryManager = await getMemoryManager({
  dbPath: '~/.agentwork/data/memory.db',
  enableVectorSearch: true,
  vectorDimensions: 1536
}, process.env.OPENAI_API_KEY);

// 存储记忆 (自动向量化)
await memoryManager.storeGlobal('项目使用 TypeScript 开发');

// 向量搜索
const results = await memoryManager.search('AI 开发相关', {
  useVectorSearch: true,
  limit: 5,
  minScore: 0.3
});
```

## API 参考

### Embedder (向量化)

```typescript
interface Embedder {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// 创建 Embedder
const embedder = createEmbedder({
  provider: 'openai',      // 'openai' | 'local'
  apiKey: '...',           // OpenAI API Key
  model: 'text-embedding-3-small',
  dimensions: 1536
});
```

### VectorStore (向量存储)

```typescript
class VectorStore {
  add(text: string, vector: number[], options?: StoreOptions): Promise<VectorEntry>;
  addBatch(items: Array<{text, vector, metadata}>): Promise<VectorEntry[]>;
  get(id: string): Promise<VectorEntry | null>;
  delete(id: string): Promise<void>;
  list(options?: ListOptions): Promise<VectorEntry[]>;
  count(): number;
  clear(): void;
  close(): void;
}
```

### VectorSearch (向量搜索)

```typescript
interface VectorSearch {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  similarity(vec1: number[], vec2: number[]): number;
}

// 搜索选项
interface SearchOptions {
  limit?: number;          // 最大结果数 (默认 10)
  minScore?: number;       // 最小相似度 (0-1)
  metadataFilter?: Record; // 元数据过滤
  includeVector?: boolean; // 是否返回向量
}
```

## 距离度量

支持三种相似度计算方式:

| 度量类型 | 方法 | 范围 | 适用场景 |
|---------|------|------|---------|
| Cosine (余弦) | `cosine` | 0-1 | 文本相似度 (推荐) |
| Euclidean (欧几里得) | `euclidean` | 0-1 | 空间距离 |
| Dot Product (点积) | `dot_product` | 0-1 | 归一化向量 |

```typescript
const search = createVectorSearch(embedder, store, 'cosine');
```

## 文件结构

```
src/vector/
├── index.ts           # 入口文件，导出所有 API
├── types.ts           # 类型定义
├── embedder.ts        # 向量化实现 (OpenAI/本地)
├── store.ts           # 向量存储 (SQLite)
├── search.ts          # 向量搜索
└── example.ts         # 使用示例
```

## 配置选项

### EmbedderConfig

```typescript
interface EmbedderConfig {
  provider: 'openai' | 'local';
  apiKey?: string;           // OpenAI 需要
  model?: string;            // 默认：text-embedding-3-small
  dimensions?: number;       // OpenAI: 1536, Local: 384
}
```

### VectorStoreConfig

```typescript
interface VectorStoreConfig {
  dbPath: string;            // SQLite 数据库路径
  dimensions: number;        // 向量维度
}
```

## 性能优化

### 批量操作

```typescript
// 批量添加 (比单个添加快 10 倍+)
await vectorSystem.addBatch([
  { text: '文本 1', metadata: {...} },
  { text: '文本 2', metadata: {...} },
  // ... 最多 100 条
]);

// 批量向量化
const vectors = await embedder.embedBatch(texts);
```

### 索引优化

SQLite 自动创建以下索引:
- `idx_vectors_created` - 按时间排序

对于大规模数据 (>10 万条),考虑:
- 使用专门的向量数据库 (pgvector, Qdrant, etc.)
- 添加 HNSW 索引加速近似最近邻搜索

## 环境变量

```bash
# OpenAI API Key (使用 OpenAI Embedding 时需要)
export OPENAI_API_KEY=sk-...
```

## 运行示例

```bash
cd ~/Desktop/agentwork
export OPENAI_API_KEY=your-key
npx tsx src/vector/example.ts
```

## 注意事项

1. **API 成本**: OpenAI Embedding 按 token 计费
   - text-embedding-3-small: $0.02 / 1M tokens
   
2. **向量维度**: 
   - 必须保持一致 (添加和搜索使用相同维度)
   - OpenAI: 1536 (text-embedding-3-small)
   
3. **数据库路径**: 
   - 使用 `~` 会自动扩展到用户主目录
   - 确保目录有写入权限

4. **错误处理**:
   ```typescript
   try {
     await vectorSystem.search('query');
   } catch (error) {
     // 网络错误、API 限制等
     console.error('Search failed:', error);
   }
   ```

## 扩展阅读

- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [SQLite 性能优化](https://www.sqlite.org/speed.html)
- [余弦相似度详解](https://en.wikipedia.org/wiki/Cosine_similarity)
