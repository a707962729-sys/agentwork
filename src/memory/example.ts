/**
 * 记忆系统使用示例
 */

import { getMemoryManager } from './index.js';
import type { MemorySearchResult } from '../types.js';

async function demonstrateMemorySystem() {
  console.log('=== AgentWork 记忆系统示例 ===\n');

  // 1. 获取记忆管理器实例
  const memoryManager = await getMemoryManager({
    dbPath: '~/.agentwork/data/memory.db',
    enableVectorSearch: false // 暂时禁用向量检索
  });

  try {
    // ========================================
    // 2. 存储记忆示例
    // ========================================
    console.log('📝 存储记忆示例:\n');

    // 2.1 全局记忆 - 长期知识和决策
    const globalMemory = await memoryManager.storeGlobal(
      '项目使用 TypeScript 开发，数据库采用 SQLite',
      { category: 'technical-decision', importance: 'high' }
    );
    console.log(`✓ 存储全局记忆: ${globalMemory.id}`);

    // 2.2 项目记忆 - 项目级别的上下文
    const projectMemory = await memoryManager.storeProject(
      'project-123',
      '这个项目是自媒体内容自动化平台，包含工作流引擎和技能系统',
      { projectName: 'AgentWork', version: '1.0.0' }
    );
    console.log(`✓ 存储项目记忆: ${projectMemory.id}`);

    // 2.3 任务记忆 - 任务执行上下文
    const taskMemory = await memoryManager.storeTask(
      'task-456',
      '任务：写一篇关于 AI Agent 的文章，需要包含架构设计和工作流程说明',
      { taskType: 'content', priority: 'high' }
    );
    console.log(`✓ 存储任务记忆: ${taskMemory.id}`);

    // 2.4 会话记忆 - 对话历史
    const sessionMemory = await memoryManager.storeSession(
      'session-789',
      '用户询问了关于记忆系统的设计，解释了四层架构的概念',
      { topic: 'memory-system', participant: 'user' }
    );
    console.log(`✓ 存储会话记忆: ${sessionMemory.id}\n`);

    // ========================================
    // 3. 搜索记忆示例
    // ========================================
    console.log('🔍 搜索记忆示例:\n');

    // 3.1 关键词搜索
    const searchResults = await memoryManager.search('AI Agent 架构', {
      limit: 5,
      minScore: 0.3
    });
    console.log(`✓ 搜索 "AI Agent 架构" 找到 ${searchResults.length} 条结果:`);
    searchResults.forEach((result: MemorySearchResult, index: number) => {
      console.log(`  ${index + 1}. [${result.entry.level}] ${result.entry.content.substring(0, 50)}... (分数：${result.score.toFixed(2)})`);
    });
    console.log('');

    // 3.2 按项目过滤搜索
    const projectResults = await memoryManager.searchProject(
      'project-123',
      '自媒体',
      10
    );
    console.log(`✓ 项目 "project-123" 中搜索 "自媒体" 找到 ${projectResults.length} 条结果\n`);

    // 3.3 按任务过滤搜索
    const taskResults = await memoryManager.searchTask(
      'task-456',
      '文章',
      10
    );
    console.log(`✓ 任务 "task-456" 中搜索 "文章" 找到 ${taskResults.length} 条结果\n`);

    // ========================================
    // 4. 自动回忆示例
    // ========================================
    console.log('🧠 自动回忆示例:\n');

    const recallResults = await memoryManager.autoRecall({
      taskId: 'task-456',
      projectId: 'project-123',
      query: '如何设计 AI Agent 的工作流程',
      keywords: ['workflow', 'architecture', 'design']
    });

    console.log(`✓ 自动回忆找到 ${recallResults.length} 条相关记忆:`);
    recallResults.forEach((result: MemorySearchResult, index: number) => {
      console.log(`  ${index + 1}. [${result.entry.level}] ${result.entry.content.substring(0, 60)}...`);
    });
    console.log('');

    // ========================================
    // 5. 获取任务上下文示例
    // ========================================
    console.log('📚 获取任务上下文示例:\n');

    const taskContext = await memoryManager.getTaskContext('task-456');
    console.log(`✓ 任务 "task-456" 的上下文包含 ${taskContext.length} 条记忆\n`);

    // ========================================
    // 6. 列出记忆示例
    // ========================================
    console.log('📋 列出记忆示例:\n');

    // 列出所有全局记忆
    const globalMemories = await memoryManager.list({
      levels: ['global']
    });
    console.log(`✓ 全局记忆共 ${globalMemories.length} 条`);

    // 列出特定项目的记忆
    const projectMemories = await memoryManager.list({
      levels: ['project'],
      projectId: 'project-123'
    });
    console.log(`✓ 项目 "project-123" 的记忆共 ${projectMemories.length} 条\n`);

    // ========================================
    // 7. 更新和删除记忆示例
    // ========================================
    console.log('✏️ 更新和删除记忆示例:\n');

    // 更新记忆
    const updatedMemory = await memoryManager.update(
      globalMemory.id,
      '项目使用 TypeScript 开发，数据库采用 SQLite，部署在 Docker 容器中'
    );
    console.log(`✓ 更新记忆 ${updatedMemory.id}`);

    // 删除记忆
    await memoryManager.delete(sessionMemory.id);
    console.log(`✓ 删除记忆 ${sessionMemory.id}\n`);

    // ========================================
    // 8. 实际使用场景示例
    // ========================================
    console.log('💡 实际使用场景示例:\n');

    console.log('场景 1: 任务开始时自动回忆历史经验');
    console.log('  - 在任务启动时调用 autoRecall() 获取相关记忆');
    console.log('  - 避免重复犯错，复用成功经验\n');

    console.log('场景 2: 项目决策记录');
    console.log('  - 使用 storeProject() 记录重要决策');
    console.log('  - 新成员加入时可快速了解项目背景\n');

    console.log('场景 3: 会话连续性');
    console.log('  - 使用 storeSession() 记录对话要点');
    console.log('  - 跨会话时保持上下文连续性\n');

    console.log('场景 4: 知识库积累');
    console.log('  - 使用 storeGlobal() 积累通用知识');
    console.log('  - 通过 search() 快速检索历史经验\n');

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    // 关闭连接
    memoryManager.close();
    console.log('✓ 记忆管理器已关闭');
  }
}

// 运行示例
demonstrateMemorySystem().catch(console.error);
