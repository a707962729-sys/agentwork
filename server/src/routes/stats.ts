/**
 * 统计 API 路由
 */

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { join } from 'path';

const router = Router();

function getStats() {
  const dbPath = join(__dirname, '..', '..', '..', 'data', 'agentwork.db');
  const db = new Database(dbPath, { readonly: true });

  try {
    const employeeStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('working','running','active') THEN 1 END) as online,
        COUNT(CASE WHEN status = 'working' THEN 1 END) as working,
        COUNT(CASE WHEN status = 'idle' THEN 1 END) as idle,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM executor_agents
    `).get() as any;

    const taskStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM executor_tasks
    `).get() as any;

    const assetStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN type = 'document' THEN 1 END) as documents,
        COUNT(CASE WHEN type = 'data' THEN 1 END) as data,
        COUNT(CASE WHEN type = 'report' THEN 1 END) as reports,
        COUNT(CASE WHEN type = 'image' THEN 1 END) as images,
        COUNT(CASE WHEN type = 'video' THEN 1 END) as videos
      FROM executor_work_assets
    `).get() as any;

    const workflowTotal = db.prepare('SELECT COUNT(*) as total FROM workflows').get() as any;
    const workflowRunTotal = db.prepare("SELECT COUNT(*) as total FROM workflow_runs WHERE status = 'completed'").get() as any;

    return {
      employees: employeeStats,
      tasks: { total: taskStats.total, completed: taskStats.completed, running: taskStats.running, pending: taskStats.pending, failed: taskStats.failed },
      assets: { total: assetStats.total, documents: assetStats.documents, data: assetStats.data, reports: assetStats.reports, images: assetStats.images, videos: assetStats.videos },
      workflows: { total: workflowTotal.total, runs: workflowRunTotal.total },
    };
  } finally {
    db.close();
  }
}

router.get('/dashboard', (_req: Request, res: Response) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (err: any) {
    // If tables don't exist yet, return zeros
    res.json({
      employees: { total: 0, online: 0, working: 0, idle: 0, pending: 0 },
      tasks: { total: 0, completed: 0, running: 0, pending: 0, failed: 0 },
      assets: { total: 0, documents: 0, data: 0, reports: 0, images: 0, videos: 0 },
      workflows: { total: 0, runs: 0 },
    });
  }
});

export default router;
