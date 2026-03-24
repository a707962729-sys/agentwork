/**
 * AgentWork Executor — Server 集成路由
 * 挂载在 /api/v1/execute/*
 *
 * 使用方式：将此文件内容合并到 server/src/index.ts 中
 * 或作为独立路由 import { router } from './routes-execute.js';
 */

import { Router, Request, Response } from 'express';
import { ExecutorOrchestrator } from '../executor/index.js';

export interface ExecuteRouterOptions {
  orchestrator: ExecutorOrchestrator;
}

export function createExecuteRouter(opts: ExecuteRouterOptions): Router {
  const router = Router();
  const { orchestrator } = opts;

  // ==================== 任务接口 ====================

  /**
   * POST /api/v1/execute/agent
   * 提交任务
   */
  router.post('/agent', async (req: Request, res: Response) => {
    try {
      const { agentId, input } = req.body as {
        agentId: string;
        input: { type: 'text' | 'json' | 'file'; content: string | object; context?: Record<string, any> };
      };

      if (!agentId || !input) {
        res.status(400).json({ error: 'agentId 和 input 是必填项' });
        return;
      }

      const agent = orchestrator.getAgent(agentId);
      if (!agent) {
        res.status(404).json({ error: `Agent '${agentId}' 不存在` });
        return;
      }

      const task = await orchestrator.submitTask(agentId, input);

      res.status(202).json({
        taskId: task.id,
        agentId: task.agentId,
        status: task.status,
        createdAt: task.createdAt,
      });
    } catch (err) {
      console.error('[execute/agent] error:', err);
      res.status(500).json({ error: '提交任务失败', detail: String(err) });
    }
  });

  /**
   * GET /api/v1/execute/task/:id
   * 查询任务状态
   */
  router.get('/task/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const task = orchestrator.getTask(id);

    if (!task) {
      res.status(404).json({ error: `任务 '${id}' 不存在` });
      return;
    }

    res.json(task);
  });

  /**
   * POST /api/v1/execute/task/:id/abort
   * 中止任务
   */
  router.post('/task/:id/abort', (req: Request, res: Response) => {
    const { id } = req.params;
    const task = orchestrator.getTask(id);

    if (!task) {
      res.status(404).json({ error: `任务 '${id}' 不存在` });
      return;
    }

    orchestrator.stopTask(id);
    res.json({ taskId: id, status: 'cancelled' });
  });

  /**
   * GET /api/v1/execute/stats
   * 执行统计
   */
  router.get('/stats', (_req: Request, res: Response) => {
    const stats = orchestrator.getStats();
    res.json(stats);
  });

  // ==================== Agent 接口 ====================

  /**
   * POST /api/v1/execute/agents
   * 注册 Agent
   */
  router.post('/agents', (req: Request, res: Response) => {
    try {
      const agent = req.body;
      if (!agent.id || !agent.name || !agent.model) {
        res.status(400).json({ error: 'id, name, model 是必填项' });
        return;
      }
      orchestrator.registerAgent(agent);
      res.status(201).json({ id: agent.id, name: agent.name, status: 'registered' });
    } catch (err) {
      console.error('[execute/agents] error:', err);
      res.status(500).json({ error: '注册 Agent 失败', detail: String(err) });
    }
  });

  /**
   * GET /api/v1/execute/agents
   * 列表 Agent
   */
  router.get('/agents', (_req: Request, res: Response) => {
    res.json(orchestrator.listAgents());
  });

  /**
   * GET /api/v1/execute/agents/:id
   * 获取 Agent
   */
  router.get('/agents/:id', (req: Request, res: Response) => {
    const agent = orchestrator.getAgent(req.params.id);
    if (!agent) {
      res.status(404).json({ error: `Agent '${req.params.id}' 不存在` });
      return;
    }
    res.json(agent);
  });

  /**
   * DELETE /api/v1/execute/agents/:id
   * 删除 Agent
   */
  router.delete('/agents/:id', (req: Request, res: Response) => {
    // Agent 不提供删除接口（任务关联），仅标记禁用
    res.status(405).json({ error: '不支持删除，请禁用 Agent' });
  });

  return router;
}

// ==================== Server 集成说明 ====================
//
// 在 server/src/index.ts 中添加以下代码：
//
// import { createExecuteRouter } from './routes-execute.js';
//
// // 初始化 Executor Orchestrator（复用现有数据库路径）
// import { initExecutorDb } from '../executor/db.js';
// const dbPath = join(__dirname, '../../data/agentwork.db');
// const executorDb = initExecutorDb(dbPath);
//
// const orchestrator = createOrchestrator(executorDb);
// await orchestrator.init(dbPath);
//
// app.locals.orchestrator = orchestrator;
//
// // 注册路由
// app.use('/api/v1/execute', createExecuteRouter({ orchestrator }));
//
// // 启动执行引擎轮询
// orchestrator.start();
//
// // 监听事件并通过 Socket.IO 推送
// orchestrator.on('task:completed', (data) => {
//   app.locals.io?.to('tasks').emit('task:completed', data);
// });
//
// export { orchestrator };
