# AgentWork 记忆系统

四层记忆架构，支持全局、项目、任务和会话级别的记忆存储与检索。

## 📁 文件结构

```
src/memory/
├── index.ts          # 记忆管理器入口，提供统一 API
├── store.ts          # SQLite 存储实现
├── search.ts         # 搜索与检索逻辑
├── types.ts          # 类型定义
└── example.ts        # 使用示例
```

## 🏗️ 四层记忆架构

### 1. 全局记忆 (Global)
- **用途**: 长期记忆，跨项目的通用知识和决策
- **示例**: 技术选型、最佳实践、用户偏好
- **生命周期**: 永久，除非手动删除

### 2. 项目记忆 (Project)
- **用途**: 项目级别的知识和上下文
- **示例**: 项目目标、架构决策、团队约定
- **生命周期**: 与项目共存亡
- **必需参数**: `projectId`

### 3. 任务记忆 (Task)
- **用途**: 任务执行过程中的上下文
- **示例**: 任务需求、执行步骤、中间结果
- **生命周期**: 任务完成后归档
- **必需参数**: `taskId`

### 4. 会话记忆 (Session)
- **用途**: 单次对话/会话的历史记录
- **示例**: 对话要点、用户反馈、临时决策
- **生命周期**: 会话结束后清理
- **必需参数**: `sessionId`

## 🚀 快速开始

### 初始化

```typescript
import { getMemoryManager } from './memory/index.js';

const memoryManager = await getMemoryManager({
  dbPath: '~/.agentwork/data/memory.db',
  enableVectorSearch: false // 可选：启用向量检索
});
```

### 存储记忆

```typescript
// 全局记忆
await memoryManager.storeGlobal(
  '项目使用 TypeScript 开发',
  { category: 'tech-stack' }
);

// 项目记忆
await memoryManager.storeProject(
  'project-123',
  '项目目标是构建自动化内容平台',
  { projectName: 'AgentWork' }
);

// 任务记忆
await memoryManager.storeTask(
  'task-456',
  '任务：写一篇关于 AI 的文章',
  { priority: 'high' }
);

// 会话记忆
await memoryManager.storeSession(
  'session-789',
  '用户询问了记忆系统的设计',
  { topic: 'memory' }
);
```

### 搜索记忆

```typescript
// 关键词搜索
const results = await memoryManager.search('AI 架构', {
  limit: 10,
  minScore: 0.3
});

// 按项目过滤
const projectResults = await memoryManager.searchProject(
  'project-123',
  '工作流',
  10
);

// 按任务过滤
const taskResults = await memoryManager.searchTask(
  'task-456',
  '需求',
  10
);
```

### 自动回忆

```typescript
// 基于上下文自动检索相关记忆
const recallResults = await memoryManager.autoRecall({
  taskId: 'task-456',
  projectId: 'project-123',
  query: '如何设计工作流',
  keywords: ['workflow', 'design']
});
```

### 获取任务上下文

```typescript
// 获取任务相关的所有记忆（包括项目记忆）
const context = await memoryManager.getTaskContext('task-456');
```

### 管理记忆

```typescript
// 列出记忆
const memories = await memoryManager.list({
  levels: ['global', 'project'],
  projectId: 'project-123'
});

// 获取单条记忆
const memory = await memoryManager.get('memory-id');

// 更新记忆
await memoryManager.update('memory-id', '新内容');

// 删除记忆
await memoryManager.delete('memory-id');
```

## 🔍 搜索功能

### 关键词搜索
- 基于文本匹配
- 自动分词和归一化
- 返回匹配度分数 (0-1)

### 向量检索 (可选)
- 支持余弦相似度计算
- 需要集成 embedding 模型
- 更适合语义搜索

### 搜索选项

```typescript
interface SearchOptions {
  levels?: MemoryLevel[];      // 级别过滤
  projectId?: string;          // 项目过滤
  taskId?: string;             // 任务过滤
  sessionId?: string;          // 会话过滤
  limit?: number;              // 结果数量 (默认 10)
  minScore?: number;           // 最小分数
  startTime?: Date;            // 时间范围
  endTime?: Date;
  useVectorSearch?: boolean;   // 是否使用向量检索
}
```

## 💡 使用场景

### 场景 1: 任务启动时回忆历史
```typescript
// 在任务开始时自动获取相关经验
const memories = await memoryManager.autoRecall({
  taskId: task.id,
  query: task.description,
  keywords: extractKeywords(task)
});

// 将历史经验提供给 Agent
agent.setContext(memories.map(m => m.entry.content));
```

### 场景 2: 项目决策记录
```typescript
// 记录重要决策
await memoryManager.storeProject(projectId, 
  '选择 SQLite 作为数据库，因为...',
  { type: 'decision', category: 'architecture' }
);

// 新成员查阅
const decisions = await memoryManager.searchProject(
  projectId, '数据库', 20
);
```

### 场景 3: 会话连续性
```typescript
// 会话结束时记录要点
await memoryManager.storeSession(sessionId,
  '确定使用工作流引擎处理任务编排',
  { summary: true }
);

// 下次会话时恢复上下文
const history = await memoryManager.search('', {
  sessionId: previousSessionId
});
```

### 场景 4: 知识库积累
```typescript
// 任务完成后总结经验
await memoryManager.storeGlobal(
  '使用 checkpoint 验证工作流节点质量',
  { category: 'best-practice', source: 'task-123' }
);

// 未来任务检索
const bestPractices = await memoryManager.search(
  'checkpoint 验证', { levels: ['global'] }
);
```

## 📊 数据库 Schema

```sql
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,              -- global/project/task/session
  project_id TEXT,                  -- 项目 ID
  task_id TEXT,                     -- 任务 ID
  session_id TEXT,                  -- 会话 ID
  content TEXT NOT NULL,            -- 记忆内容
  metadata TEXT,                    -- JSON 元数据
  embedding TEXT,                   -- JSON 向量嵌入
  created_at INTEGER NOT NULL       -- 时间戳
);
```

## ⚙️ 配置选项

```typescript
interface MemoryStoreConfig {
  dbPath: string;                   // 数据库路径
  enableVectorSearch?: boolean;     // 启用向量检索
  vectorDimensions?: number;        // 向量维度 (默认 384)
}
```

## 🧪 运行示例

```bash
cd ~/Desktop/agentwork
npm run build
node dist/memory/example.js
```

## 🔮 未来扩展

- [ ] 集成实际的 embedding 模型 (OpenAI/Cohere)
- [ ] 支持向量数据库 (LanceDB/Pinecone)
- [ ] 记忆压缩和归档
- [ ] 记忆关联图谱
- [ ] 自动记忆清理策略
