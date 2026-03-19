/**
 * 工作流 API 路由
 */

import { Router, Request, Response } from 'express';

const router = Router();

// 获取工作流列表
router.get('/', (req: Request, res: Response) => {
  const workflowEngine = req.app.locals.workflowEngine;
  const workflows = workflowEngine.listWorkflows();
  res.json({ workflows, total: workflows.length });
});

// 获取单个工作流
router.get('/:id', (req: Request, res: Response) => {
  const workflowEngine = req.app.locals.workflowEngine;
  const workflow = workflowEngine.getWorkflow(req.params.id);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  res.json(workflow);
});

// 运行工作流
router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const workflowEngine = req.app.locals.workflowEngine;
    const inputs = req.body.inputs || {};
    
    const run = await workflowEngine.run(req.params.id, inputs);
    res.status(201).json(run);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取工作流运行状态
router.get('/:id/runs/:runId', (req: Request, res: Response) => {
  const db = req.app.locals.db;
  const run = db.getWorkflowRun(req.params.runId);
  
  if (!run) {
    return res.status(404).json({ error: 'Workflow run not found' });
  }
  
  res.json(run);
});

export default router;