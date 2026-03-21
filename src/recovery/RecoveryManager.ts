/**
 * 崩溃恢复管理器
 */

import { DatabaseManager } from '../db/index.js';
import { v4 as uuid } from 'uuid';
import type { TaskStep } from '../types.js';

export interface StateSnapshot {
  id: string;
  runId: string;
  stepId: string;
  state: string;  // JSON
  createdAt: Date;
}

export class RecoveryManager {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
    this.initTable();
  }

  /**
   * 初始化快照表
   */
  private initTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS state_snapshots (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        state TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_run_id ON state_snapshots(run_id)
    `);
  }

  /**
   * 保存步骤状态快照
   */
  saveSnapshot(runId: string, stepId: string, state: any): StateSnapshot {
    const snapshot: StateSnapshot = {
      id: uuid(),
      runId,
      stepId,
      state: JSON.stringify(state),
      createdAt: new Date()
    };

    this.db.exec(
      'INSERT INTO state_snapshots (id, run_id, step_id, state, created_at) VALUES (?, ?, ?, ?, ?)',
      [snapshot.id, snapshot.runId, snapshot.stepId, snapshot.state, snapshot.createdAt.toISOString()]
    );

    return snapshot;
  }

  /**
   * 获取运行的所有快照
   */
  getSnapshots(runId: string): StateSnapshot[] {
    const rows = this.db.query<{
      id: string;
      run_id: string;
      step_id: string;
      state: string;
      created_at: string;
    }>(
      'SELECT * FROM state_snapshots WHERE run_id = ? ORDER BY created_at ASC',
      [runId]
    );

    return rows.map(row => ({
      id: row.id,
      runId: row.run_id,
      stepId: row.step_id,
      state: row.state,
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * 获取最后一个成功的步骤
   */
  getLastSuccessfulStep(runId: string, steps: TaskStep[]): { stepId: string; stepIndex: number } | null {
    const snapshots = this.getSnapshots(runId);
    if (snapshots.length === 0) return null;

    // 找到最近一个成功的步骤
    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i];
      const snapshot = snapshots.find(s => s.stepId === step.id);
      if (snapshot) {
        const state = JSON.parse(snapshot.state);
        if (state.status === 'passed' || state.status === 'completed') {
          return { stepId: step.id, stepIndex: i };
        }
      }
    }

    return null;
  }

  /**
   * 恢复运行状态
   */
  restoreState(runId: string): { steps: TaskStep[]; currentIndex: number } | null {
    const snapshots = this.getSnapshots(runId);
    if (snapshots.length === 0) return null;

    const steps: TaskStep[] = [];
    let currentIndex = 0;

    for (const snapshot of snapshots) {
      const state = JSON.parse(snapshot.state);
      steps.push(state);
      
      if (state.status === 'running') {
        currentIndex = steps.length - 1;
      } else if (state.status === 'passed' || state.status === 'completed') {
        currentIndex = steps.length;
      }
    }

    return { steps, currentIndex };
  }

  /**
   * 清理旧快照（保留最近 N 个）
   */
  cleanupSnapshots(runId: string, keepCount: number = 100): void {
    this.db.exec(
      `DELETE FROM state_snapshots 
       WHERE run_id = ? 
       AND id NOT IN (
         SELECT id FROM state_snapshots 
         WHERE run_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?
       )`,
      [runId, runId, keepCount]
    );
  }

  /**
   * 删除运行的所有快照
   */
  deleteSnapshots(runId: string): void {
    this.db.exec('DELETE FROM state_snapshots WHERE run_id = ?', [runId]);
  }
}
