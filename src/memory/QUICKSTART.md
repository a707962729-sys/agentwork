# 记忆系统快速开始

## 5 分钟上手

### 1️⃣ 初始化
```typescript
import { getMemoryManager } from './memory/index.js';

const memory = await getMemoryManager();
```

### 2️⃣ 存储记忆
```typescript
// 全局记忆 - 长期知识
await memory.storeGlobal('项目使用 TypeScript + SQLite');

// 项目记忆 - 项目上下文
await memory.storeProject('project-123', '自媒体内容自动化平台');

// 任务记忆 - 任务上下文
await memory.storeTask('task-456', '写一篇关于 AI Agent 的文章');

// 会话记忆 - 对话历史
await memory.storeSession('session-789', '用户询问了记忆系统设计');
```

### 3️⃣ 搜索记忆
```typescript
// 关键词搜索
const results = await memory.search('AI Agent', { limit: 10 });

// 按项目搜索
const projectResults = await memory.searchProject('project-123', '工作流');

// 按任务搜索
const taskResults = await memory.searchTask('task-456', '需求');
```

### 4️⃣ 自动回忆
```typescript
// 基于上下文自动获取相关记忆
const context = await memory.autoRecall({
  taskId: 'task-456',
  query: '如何设计架构',
  keywords: ['architecture', 'design']
});
```

### 5️⃣ 获取任务上下文
```typescript
// 获取任务相关的所有记忆 (包括项目记忆)
const fullContext = await memory.getTaskContext('task-456');
```

## 常用 API

| 方法 | 说明 | 示例 |
|------|------|------|
| `storeGlobal()` | 存储全局记忆 | `storeGlobal(content, metadata)` |
| `storeProject()` | 存储项目记忆 | `storeProject(id, content)` |
| `storeTask()` | 存储任务记忆 | `storeTask(id, content)` |
| `storeSession()` | 存储会话记忆 | `storeSession(id, content)` |
| `search()` | 搜索记忆 | `search(query, options)` |
| `autoRecall()` | 自动回忆 | `autoRecall(context)` |
| `getTaskContext()` | 获取任务上下文 | `getTaskContext(taskId)` |
| `list()` | 列出记忆 | `list({ levels: ['global'] })` |
| `get()` | 获取记忆 | `get(memoryId)` |
| `update()` | 更新记忆 | `update(id, newContent)` |
| `delete()` | 删除记忆 | `delete(memoryId)` |

## 搜索选项

```typescript
const options = {
  levels: ['global', 'project'],  // 级别过滤
  projectId: 'project-123',       // 项目过滤
  taskId: 'task-456',             // 任务过滤
  limit: 10,                      // 结果数量
  minScore: 0.3,                  // 最小分数
  startTime: new Date(),          // 时间范围
  useVectorSearch: false          // 向量检索
};
```

## 完整示例

```typescript
import { getMemoryManager } from './memory/index.js';

async function main() {
  const memory = await getMemoryManager();
  
  try {
    // 存储
    const entry = await memory.storeTask('task-1', '写文章');
    
    // 搜索
    const results = await memory.search('文章', { limit: 5 });
    
    // 回忆
    const context = await memory.autoRecall({
      taskId: 'task-1',
      query: '写作要求'
    });
    
    console.log('找到', results.length, '条记忆');
  } finally {
    memory.close();
  }
}

main();
```

## 运行示例

```bash
cd ~/Desktop/agentwork
npm run build
node dist/memory/example.js
```

## 更多信息

- 📖 [README.md](./README.md) - 详细文档
- 💡 [example.ts](./example.ts) - 完整示例
- 📝 [IMPLEMENTATION.md](./IMPLEMENTATION.md) - 实现总结
