import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseManager } from '../db/index.js';
import { TaskOrchestrator } from '../orchestrator/index.js';
import { APIResponse, TaskItem, TaskDetail, TaskStepItem } from './types.js';

export function createTasksRouter(
  db: DatabaseManager,
  orchestrator: TaskOrchestrator
): Router {
  const router = Router();

  // GET /api/tasks - 获取任务列表
  router.get('/', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit?.toString() || '50');
      const tasks = orchestrator.listTasks(limit);

      const response: APIResponse<TaskItem[]> = {
        success: true,
        data: tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          type: t.type,
          status: t.status,
          priority: t.priority,
          workflowId: t.workflowId,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          startedAt: t.startedAt?.toISOString(),
          completedAt: t.completedAt?.toISOString()
        }))
      };

      res.json(response);
    } catch (error: any) {
      const response: APIResponse = {
        success: false,
        error: 'Failed to fetch tasks',
        message: error.message
      };
      res.status(500).json(response);
    }
  });

  // GET /api/tasks/:id - 获取任务详情
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const task = orchestrator.getTask(id);

      if (!task) {
        const response: APIResponse = {
          success: false,
          error: 'Task not found',
          message: `Task with id ${id} not found`
        };
        res.status(404).json(response);
        return;
      }

      const response: APIResponse<TaskDetail> = {
        success: true,
        data: {
          id: task.id,
          title: task.title,
          description: task.description,
          type: task.type,
          status: task.status,
          priority: task.priority,
          workflowId: task.workflowId,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          startedAt: task.startedAt?.toISOString(),
          completedAt: task.completedAt?.toISOString(),
          result: task.result,
          error: task.error,
          steps: task.steps.map(s => ({
            id: s.id,
            orderId: s.orderId,
            title: s.title,
            description: s.description,
            skill: s.skill,
            agent: s.agent,
            status: s.status,
            input: s.input,
            output: s.output,
            dependsOn: s.dependsOn,
            retryCount: s.retryCount,
            maxRetries: s.maxRetries,
            startedAt: s.startedAt?.toISOString(),
            completedAt: s.completedAt?.toISOString(),
            error: s.error
          }))
        }
      };

      res.json(response);
    } catch (error: any) {
      const response: APIResponse = {
        success: false,
        error: 'Failed to fetch task',
        message: error.message
      };
      res.status(500).json(response);
    }
  });

  // POST /api/tasks - 创建任务
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { title, description, type, priority, workflowId } = req.body;

      if (!title) {
        const response: APIResponse = {
          success: false,
          error: 'Title is required'
        };
        res.status(400).json(response);
        return;
      }

      const task = await orchestrator.createTask({
        title,
        description: description || '',
        type: (type as any) || 'custom',
        priority: (priority as any) || 'normal',
        workflowId
      });

      const response: APIResponse<TaskItem> = {
        success: true,
        message: 'Task created successfully',
        data: {
          id: task.id,
          title: task.title,
          description: task.description,
          type: task.type,
          status: task.status,
          priority: task.priority,
          workflowId: task.workflowId,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString()
        }
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: APIResponse = {
        success: false,
        error: 'Failed to create task',
        message: error.message
      };
      res.status(500).json(response);
    }
  });

  // PUT /api/tasks/:id - 更新任务
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, type, priority, status } = req.body;

      const task = orchestrator.getTask(id);
      if (!task) {
        const response: APIResponse = {
          success: false,
          error: 'Task not found'
        };
        res.status(404).json(response);
        return;
      }

      // 只允许更新某些字段
      const updates: Partial<typeof task> = {};
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (priority) updates.priority = priority;

      // 更新数据库
      updates.updatedAt = new Date();
      db.updateTask(id, updates);

      const updatedTask = db.getTask(id)!;

      const response: APIResponse<TaskItem> = {
        success: true,
        message: 'Task updated successfully',
        data: {
          id: updatedTask.id,
          title: updatedTask.title,
          description: updatedTask.description,
          type: updatedTask.type,
          status: updatedTask.status,
          priority: updatedTask.priority,
          workflowId: updatedTask.workflowId,
          createdAt: updatedTask.createdAt.toISOString(),
          updatedAt: updatedTask.updatedAt.toISOString()
        }
      };

      res.json(response);
    } catch (error: any) {
      const response: APIResponse = {
        success: false,
        error: 'Failed to update task',
        message: error.message
      };
      res.status(500).json(response);
    }
  });

  // DELETE /api/tasks/:id - 删除任务
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // 删除任务
      db.deleteTask(id);

      const response: APIResponse = {
        success: true,
        message: 'Task deleted successfully'
      };

      res.json(response);
    } catch (error: any) {
      const response: APIResponse = {
        success: false,
        error: 'Failed to delete task',
        message: error.message
      };
      res.status(500).json(response);
    }
  });

  return router;
}
