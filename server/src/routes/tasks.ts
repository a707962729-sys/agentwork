/**
 * 任务 API 路由
 */

import { Router, Request, Response } from 'express';

const router = Router();

// 获取任务列表
router.get('/', (req: Request, res: Response) => {
  const orchestrator = req.app.locals.orchestrator;
  const limit = parseInt(req.query.limit as string) || 50;
  const tasks = orchestrator.listTasks(limit);
  res.json({ tasks, total: tasks.length });
});

// 获取单个任务
router.get('/:id', (req: Request, res: Response) => {
  const orchestrator = req.app.locals.orchestrator;
  const task = orchestrator.getTask(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json(task);
});

// 创建任务
router.post('/', async (req: Request, res: Response) => {
  try {
    const orchestrator = req.app.locals.orchestrator;
    const { title, description, type, priority, workflowId } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const task = await orchestrator.createTask({
      title,
      description,
      type,
      priority,
      workflowId
    });
    
    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 执行任务
router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const orchestrator = req.app.locals.orchestrator;
    await orchestrator.execute(req.params.id);
    res.json({ success: true, message: 'Task execution started' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 暂停任务
router.post('/:id/pause', (req: Request, res: Response) => {
  const db = req.app.locals.db;
  const task = db.getTask(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  db.updateTask(req.params.id, { status: 'paused' });
  res.json({ success: true, status: 'paused' });
});

// 取消任务
router.post('/:id/cancel', (req: Request, res: Response) => {
  const db = req.app.locals.db;
  const task = db.getTask(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  db.updateTask(req.params.id, { status: 'failed', error: 'Cancelled by user' });
  res.json({ success: true, status: 'cancelled' });
});

// 删除任务
router.delete('/:id', (req: Request, res: Response) => {
  const db = req.app.locals.db;
  db.deleteTask(req.params.id);
  res.json({ success: true });
});

export default router;