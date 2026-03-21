import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../db/index.js';
import { WorkflowEngine } from '../workflow/engine.js';
import { APIResponse, WorkflowItem, WorkflowRunResponse, RunWorkflowRequest } from './types.js';

export function createWorkflowsRouter(
  db: DatabaseManager,
  engine: WorkflowEngine
): Router {
  const router = Router();

  // GET /api/workflows - 获取工作流列表
  router.get('/', async (req: Request, res: Response) => {
    try {
      const workflows = engine.listWorkflows();

      const response: APIResponse<WorkflowItem[]> = {
        success: true,
        data: workflows.map(w => ({
          id: w.metadata.id,
          name: w.metadata.name,
          description: w.metadata.description,
          category: w.metadata.tags?.[0] || 'general',
          agents: w.steps
            .map(s => s.agent)
            .filter((a): a is string => !!a)
            .map(agent => ({
              id: agent,
              type: 'auto',
              trigger: 'auto'
            })),
          steps: w.steps.map(s => ({
            id: s.id,
            name: s.name,
            agent: s.agent || 'default',
            auto: true
          })),
          createdAt: w.metadata.version || '2024-01-01',
          enabled: true
        }))
      };

      res.json(response);
    } catch (error: any) {
      const response: APIResponse = {
        success: false,
        error: 'Failed to fetch workflows',
        message: error.message
      };
      res.status(500).json(response);
    }
  });

  // GET /api/workflows/:id - 获取工作流详情
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const workflow = engine.getWorkflow(id);

      if (!workflow) {
        const response: APIResponse = {
          success: false,
          error: 'Workflow not found',
          message: `Workflow with id ${id} not found`
        };
        res.status(404).json(response);
        return;
      }

      const response: APIResponse<WorkflowItem> = {
        success: true,
        data: {
          id: workflow.metadata.id,
          name: workflow.metadata.name,
          description: workflow.metadata.description,
          category: workflow.metadata.tags?.[0] || 'general',
          agents: workflow.steps
            .map(s => s.agent)
            .filter((a): a is string => !!a)
            .map(agent => ({
              id: agent,
              type: 'auto',
              trigger: 'auto'
            })),
          steps: workflow.steps.map(s => ({
            id: s.id,
            name: s.name,
            agent: s.agent || 'default',
            auto: true
          })),
          createdAt: workflow.metadata.version || '2024-01-01',
          enabled: true
        }
      };

      res.json(response);
    } catch (error: any) {
      const response: APIResponse = {
        success: false,
        error: 'Failed to fetch workflow',
        message: error.message
      };
      res.status(500).json(response);
    }
  });

  // POST /api/workflows/:id/run - 运行工作流
  router.post('/:id/run', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { inputs } = req.body as RunWorkflowRequest;

      const run = await engine.run(id, inputs || {});

      const response: APIResponse<WorkflowRunResponse> = {
        success: true,
        message: 'Workflow started successfully',
        data: {
          runId: run.id,
          status: run.status,
          startedAt: run.startedAt?.toISOString()
        }
      };

      res.status(202).json(response);
    } catch (error: any) {
      const response: APIResponse = {
        success: false,
        error: 'Failed to start workflow',
        message: error.message
      };
      res.status(500).json(response);
    }
  });

  // PUT /api/workflows/:id/enable - 启用/禁用工作流
  router.put('/:id/enable', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      // 简化实现 - 保存到配置文件
      const workflow = engine.getWorkflow(id);
      if (!workflow) {
        const response: APIResponse = {
          success: false,
          error: 'Workflow not found'
        };
        res.status(404).json(response);
        return;
      }

      // 这里应该保存到配置文件
      // 暂时只返回成功
      const response: APIResponse = {
        success: true,
        message: enabled 
          ? 'Workflow enabled successfully' 
          : 'Workflow disabled successfully'
      };

      res.json(response);
    } catch (error: any) {
      const response: APIResponse = {
        success: false,
        error: 'Failed to update workflow status',
        message: error.message
      };
      res.status(500).json(response);
    }
  });

  return router;
}
