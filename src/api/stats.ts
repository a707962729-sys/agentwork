import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../db/index.js';
import { TaskOrchestrator } from '../orchestrator/index.js';
import { APIResponse, StatsResponse } from './types.js';

export function createStatsRouter(
  db: DatabaseManager,
  orchestrator: TaskOrchestrator
): Router {
  const router = Router();

  // GET /api/stats - 获取仪表盘统计数据
  router.get('/', async (req: Request, res: Response) => {
    try {
      // 获取任务统计
      const allTasks = orchestrator.listTasks(10000);
      
      const taskStats = {
        total: allTasks.length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        failed: allTasks.filter(t => t.status === 'failed').length,
        running: allTasks.filter(t => t.status === 'running').length,
        pending: allTasks.filter(t => ['pending', 'ready', 'decomposing'].includes(t.status)).length
      };

      // 统计产出
      let totalArticles = 0;
      let totalImages = 0;
      let totalFiles = 0;

      for (const task of allTasks) {
        if (task.result) {
          // 简单统计 - 实际应该根据 result 类型判断
          if (task.result.articleUrl) totalArticles++;
          if (task.result.images && Array.isArray(task.result.images)) {
            totalImages += task.result.images.length;
          }
          if (task.result.files && Array.isArray(task.result.files)) {
            totalFiles += task.result.files.length;
          }
        }
      }

      const outputStats = {
        totalArticles,
        totalImages,
        totalFiles
      };

      // 统计 Agent 利用率
      const agentUsage: Record<string, number> = {};
      
      for (const task of allTasks) {
        for (const step of task.steps) {
          if (step.agent && !agentUsage[step.agent]) {
            agentUsage[step.agent] = 0;
          }
          if (step.agent) {
            agentUsage[step.agent]++;
          }
        }
      }

      const agentStats = {
        activeAgents: Object.keys(agentUsage).length,
        tasksPerAgent: agentUsage
      };

      const stats: StatsResponse = {
        tasks: taskStats,
        outputs: outputStats,
        agentUsage: agentStats
      };

      const response: APIResponse<StatsResponse> = {
        success: true,
        data: stats
      };

      res.json(response);
    } catch (error: any) {
      const response: APIResponse = {
        success: false,
        error: 'Failed to fetch stats',
        message: error.message
      };
      res.status(500).json(response);
    }
  });

  return router;
}
