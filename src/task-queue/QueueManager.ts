import { DatabaseManager } from '../db/index.js';
import { v4 as uuid } from 'uuid';

export interface QueueItem {
  id: string;
  taskId: string;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export class QueueManager {
  private db: DatabaseManager;
  private isRunning: boolean = false;

  constructor(db: DatabaseManager) {
    this.db = db;
    this.initTable();
  }

  /**
   * 初始化队列表
   */
  private initTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_queue (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        error TEXT
      )
    `);
  }

  /**
   * 添加任务到队列
   */
  enqueue(taskId: string, priority: 'high' | 'normal' | 'low' = 'normal'): QueueItem {
    const item: QueueItem = {
      id: uuid(),
      taskId,
      priority,
      status: 'pending',
      createdAt: new Date()
    };
    
    this.db.exec(
      'INSERT INTO task_queue (id, task_id, priority, status, created_at) VALUES (?, ?, ?, ?, ?)',
      [item.id, item.taskId, item.priority, item.status, item.createdAt.toISOString()]
    );
    
    return item;
  }

  /**
   * 获取下一个待执行任务（按优先级）
   */
  dequeue(): QueueItem | null {
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
          SET status = 'running', started_at = ?
          WHERE id = ?
        `);
        updateStmt.run(new Date().toISOString(), row.id);
        
        return {
          id: row.id,
          taskId: row.task_id,
          priority: row.priority as 'high' | 'normal' | 'low',
          status: 'running',
          createdAt: new Date(row.created_at),
          startedAt: new Date(row.started_at || new Date().toISOString())
        };
      }
    }
    
    return null;
  }

  /**
   * 标记任务开始执行
   */
  markRunning(itemId: string): void {
    this.db.exec(
      'UPDATE task_queue SET status = ?, started_at = ? WHERE id = ?',
      ['running', new Date().toISOString(), itemId]
    );
  }

  /**
   * 标记任务完成
   */
  markCompleted(itemId: string): void {
    this.db.exec(
      'UPDATE task_queue SET status = ?, completed_at = ? WHERE id = ?',
      ['completed', new Date().toISOString(), itemId]
    );
  }

  /**
   * 标记任务失败
   */
  markFailed(itemId: string, error: string): void {
    this.db.exec(
      'UPDATE task_queue SET status = ?, completed_at = ?, error = ? WHERE id = ?',
      ['failed', new Date().toISOString(), error, itemId]
    );
  }

  /**
   * 获取队列长度
   */
  size(): number {
    const stmt = this.db['db'].prepare(
      "SELECT COUNT(*) as count FROM task_queue WHERE status = 'pending'"
    );
    const result = stmt.get() as any;
    return result.count || 0;
  }

  /**
   * 列出队列项
   */
  list(limit: number = 50): QueueItem[] {
    const stmt = this.db['db'].prepare(
      'SELECT * FROM task_queue ORDER BY created_at DESC LIMIT ?'
    );
    const rows = stmt.all(limit) as any[];
    
    return rows.map(row => ({
      id: row.id,
      taskId: row.task_id,
      priority: row.priority,
      status: row.status,
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      error: row.error
    }));
  }
}
