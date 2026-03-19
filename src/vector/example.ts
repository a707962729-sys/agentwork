/**
 * 向量检索模块使用示例
 * 
 * 演示如何使用向量检索系统：
 * 1. 基础向量操作
 * 2. 记忆系统集成
 * 3. 混合搜索 (关键词 + 向量)
 */

import { createVectorSystem, createEmbedder, VectorStore, createVectorSearch } from './index.js';
import { getMemoryManager } from '../memory/index.js';

// ==================== 示例 1: 基础向量检索 ====================

async function exampleBasicVectorSearch() {
  console.log('=== 示例 1: 基础向量检索 ===\n');

  // 创建向量检索系统
  const vectorSystem = await createVectorSystem({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
    dbPath: '~/.agentwork/data/vector.db'
  });

  try {
    // 添加单个文本
    const entry = await vectorSystem.add('TypeScript 是一种强类型的编程语言', {
      category: 'programming',
      language: 'typescript'
    });
    console.log('添加条目:', entry.id);

    // 批量添加文本
    const entries = await vectorSystem.addBatch([
      { text: 'Python 适合数据科学和机器学习', metadata: { category: 'programming', language: 'python' } },
      { text: 'Rust 提供内存安全保证', metadata: { category: 'programming', language: 'rust' } },
      { text: 'JavaScript 是 Web 开发的核心语言', metadata: { category: 'programming', language: 'javascript' } },
      { text: 'Go 语言擅长并发处理', metadata: { category: 'programming', language: 'go' } }
    ]);
    console.log('批量添加:', entries.length, '条目');

    // 搜索相似文本
    console.log('\n搜索 "哪种语言适合 Web 开发":');
    const results = await vectorSystem.search('哪种语言适合 Web 开发', {
      limit: 3,
      minScore: 0.5
    });

    results.forEach((result: any, index: number) => {
      console.log(`${index + 1}. [分数：${result.score.toFixed(3)}] ${result.text}`);
      if (result.metadata) {
        console.log(`   元数据：${JSON.stringify(result.metadata)}`);
      }
    });

    // 获取向量数量
    console.log('\n向量库总数:', vectorSystem.count());

  } finally {
    // 关闭连接
    vectorSystem.close();
  }
}

// ==================== 示例 2: 使用 Embedder ====================

async function exampleEmbedder() {
  console.log('\n=== 示例 2: 使用 Embedder ===\n');

  // 创建 OpenAI Embedder
  const embedder = createEmbedder({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
    dimensions: 1536
  });

  // 单个文本向量化
  const text = '人工智能正在改变世界';
  const vector = await embedder.embed(text);
  console.log('文本:', text);
  console.log('向量维度:', vector.length);
  console.log('向量前 5 个值:', vector.slice(0, 5).map((v: number) => v.toFixed(4)));

  // 批量向量化
  const texts = [
    '机器学习是 AI 的分支',
    '深度学习使用神经网络',
    '自然语言处理让计算机理解人类语言'
  ];

  const vectors = await embedder.embedBatch(texts);
  console.log('\n批量向量化:', vectors.length, '个文本');

  // 计算相似度
  const similarity = vectors[0].reduce((sum: number, val: number, i: number) => {
    return sum + val * vectors[1][i];
  }, 0);
  console.log('向量 1 和向量 2 的点积:', similarity.toFixed(4));
}

// ==================== 示例 3: 向量存储操作 ====================

async function exampleVectorStore() {
  console.log('\n=== 示例 3: 向量存储操作 ===\n');

  const embedder = createEmbedder({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
    dimensions: 1536
  });

  const store = new VectorStore({
    dbPath: '~/.agentwork/data/vectors.db',
    dimensions: 1536
  });

  try {
    // 添加向量
    const text = '向量数据库用于高效相似度搜索';
    const vector = await embedder.embed(text);
    
    const entry = await store.add(text, vector, {
      metadata: { source: 'example', timestamp: Date.now() }
    });
    console.log('添加向量条目:', entry.id);

    // 获取向量
    const retrieved = await store.get(entry.id);
    console.log('检索到的文本:', retrieved?.text);

    // 列出所有向量
    const all = await store.list({ limit: 10 });
    console.log('向量库中的条目数:', all.length);

  } finally {
    store.close();
  }
}

// ==================== 示例 4: 记忆系统集成 ====================

async function exampleMemoryIntegration() {
  console.log('\n=== 示例 4: 记忆系统集成 ===\n');

  // 启用向量检索的记忆管理器
  const memoryManager = await getMemoryManager({
    dbPath: '~/.agentwork/data/memory.db',
    enableVectorSearch: true,
    vectorDimensions: 1536
  }, process.env.OPENAI_API_KEY);

  try {
    // 存储不同类型的记忆
    await memoryManager.storeGlobal('项目使用 TypeScript 开发');
    await memoryManager.storeProject('project-123', '项目目标是构建 AI 助手');
    await memoryManager.storeTask('task-456', '任务：实现向量检索功能', {
      priority: 'high',
      assignee: 'developer'
    });
    await memoryManager.storeSession('session-789', '用户询问了关于向量数据库的问题');

    console.log('已存储 4 条记忆');

    // 搜索记忆 (使用向量相似度)
    console.log('\n搜索 "AI 开发相关":');
    const results = await memoryManager.search('AI 开发相关', {
      limit: 5,
      useVectorSearch: true,
      minScore: 0.3
    });

    results.forEach((result: any, index: number) => {
      console.log(`${index + 1}. [分数：${result.score.toFixed(3)}] [${result.entry.level}] ${result.entry.content}`);
    });

    // 自动回忆
    console.log('\n自动回忆 (task-456 上下文):');
    const recall = await memoryManager.autoRecall({
      taskId: 'task-456',
      query: '向量检索实现',
      keywords: ['vector', 'search', 'embedding']
    });

    recall.forEach((result: any, index: number) => {
      console.log(`${index + 1}. [分数：${result.score.toFixed(3)}] ${result.entry.content}`);
    });

  } finally {
    memoryManager.close();
  }
}

// ==================== 示例 5: 混合搜索策略 ====================

async function exampleHybridSearch() {
  console.log('\n=== 示例 5: 混合搜索策略 ===\n');

  const memoryManager = await getMemoryManager({
    dbPath: '~/.agentwork/data/memory.db',
    enableVectorSearch: true
  }, process.env.OPENAI_API_KEY);

  try {
    // 添加一些测试数据
    await memoryManager.storeGlobal('React 是 Facebook 开发的前端框架');
    await memoryManager.storeGlobal('Vue.js 由尤雨溪创建');
    await memoryManager.storeGlobal('Angular 是 Google 维护的框架');
    await memoryManager.storeGlobal('Svelte 是编译时框架，无需虚拟 DOM');

    // 关键词搜索
    console.log('关键词搜索 "Facebook":');
    const keywordResults = await memoryManager.search('Facebook', {
      useVectorSearch: false,
      limit: 3
    });
    keywordResults.forEach((r: any) => {
      console.log(`  - ${r.entry.content}`);
    });

    // 向量搜索
    console.log('\n向量搜索 "谁创建了 React":');
    const vectorResults = await memoryManager.search('谁创建了 React', {
      useVectorSearch: true,
      minScore: 0.5,
      limit: 3
    });
    vectorResults.forEach((r: any) => {
      console.log(`  - [${r.score.toFixed(3)}] ${r.entry.content}`);
    });

  } finally {
    memoryManager.close();
  }
}

// ==================== 运行示例 ====================

async function runExamples() {
  console.log('向量检索模块使用示例\n');
  console.log('=' .repeat(50));

  // 检查 API Key
  if (!process.env.OPENAI_API_KEY) {
    console.log('\n⚠️  警告：未设置 OPENAI_API_KEY 环境变量');
    console.log('请设置 export OPENAI_API_KEY=your-key 后重试\n');
    return;
  }

  try {
    // 运行所有示例
    await exampleEmbedder();
    await exampleBasicVectorSearch();
    await exampleVectorStore();
    await exampleMemoryIntegration();
    await exampleHybridSearch();

    console.log('\n' + '='.repeat(50));
    console.log('✅ 所有示例运行完成!');
  } catch (error) {
    console.error('❌ 示例运行出错:', error);
  }
}

// 导出示例函数供单独调用
export {
  exampleBasicVectorSearch,
  exampleEmbedder,
  exampleVectorStore,
  exampleMemoryIntegration,
  exampleHybridSearch,
  runExamples
};

// 如果直接运行此文件，执行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}
