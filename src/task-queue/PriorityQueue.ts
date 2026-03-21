/**
 * 优先级任务队列实现
 */

import { DatabaseManager } from '../db/index.js';
import { v4 as uuid } from 'uuid';

export interface QueueTask {
  id: string;
  taskId: string;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
}

export class PriorityQueue {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 添加任务到队列
   */
  async enqueue(taskId: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<string> {
    const queueTaskId = uuid();
    const now = new Date();

    // 使用数据库事务确保一致性
    const stmt = this.db['db'].prepare(`
      INSERT INTO task_queue (id, task_id, priority, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(queueTaskId, taskId, priority, 'pending', now.toISOString());

    return queueTaskId;
  }

  /**
   * 从队列获取下一个任务（按优先级）
   */
  async dequeue(): Promise<QueueTask | null> {
    // 按优先级顺序获取任务：high -> normal -> low
    const priorities = ['high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const stmt = this.db['db'].prepare(`
        SELECT * FROM task_queue 
        WHERE status = 'pending' AND priority = ?
        ORDER BY created_at ASC
        LIMIT 1
      `);
      
      const row = stmt.get(priority) as any;
      if (row) {
        // 更新状态为 running
        const updateStmt = this.db['db'].prepare(`
          UPDATE task_queue 
          SET status = 'running'
          WHERE id = ?
        `);
        updateStmt.run(row.id);
        
        return {
          id: row.id,
          taskId: row.task_id,
          priority: row.priority,
          status: 'running',
          createdAt: new Date(row.created_at)
        };
      }
    }
    
    return null;
  }

  /**
   * 标记任务完成
   */
  async markCompleted(queueTaskId: string): Promise<void> {
    const stmt = this.db['db'].prepare(`
      UPDATE task_queue 
      SET status = 'completed'
      WHERE id = ?
    `);
    stmt.run(queueTaskId);
  }

  /**
   * 标记任务失败
   */
  async markFailed(queueTaskId: string): Promise<void> {
    const stmt = this.db['db'].prepare(`
      UPDATE task_queue 
      SET status = 'failed'
      WHERE id = ?
    `);
    stmt.run(queueTaskId);
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus(): Promise<{ pending: number; running: number; completed: number; failed: number }> {
    const counts: any = {};
    const statuses = ['pending', 'running', 'completed', 'failed'];
    
    for (const status of statuses) {
      const stmt = this.db['db'].prepare(`
        SELECT COUNT(*) as count FROM task_queue WHERE status = ?
      `);
      const result = stmt.get(status) as any;
      counts[status] = result.count;
    }
    
    return {
      pending: counts.pending,
      running: counts.running,
      completed: counts.completed,
      failed: counts.failed
    };
  }
}