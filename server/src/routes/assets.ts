/**
 * 工作成果资产 API 路由
 */

import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import type { DatabaseManager } from '../../../dist/db/index.js';

const router = Router();

// GET /api/v1/assets — 成果列表（支持 type 筛选）
router.get('/', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const { type } = req.query;

  let rows: any[];
  if (type) {
    rows = db.db.prepare('SELECT * FROM executor_work_assets WHERE type = ? ORDER BY created_at DESC').all(type) as any[];
  } else {
    rows = db.db.prepare('SELECT * FROM executor_work_assets ORDER BY created_at DESC').all() as any[];
  }

  const assets = rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    created_at: row.created_at,
  }));

  res.json({ assets, total: assets.length });
});

// GET /api/v1/assets/today — 今日最新成果
router.get('/today', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const rows = db.db.prepare("SELECT * FROM executor_work_assets WHERE date(created_at) = date('now') ORDER BY created_at DESC").all() as any[];
  const assets = rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    created_at: row.created_at,
  }));
  res.json({ assets, total: assets.length });
});

// GET /api/v1/assets/:id — 成果详情
router.get('/:id', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const row = db.db.prepare('SELECT * FROM executor_work_assets WHERE id = ?').get(req.params.id) as any;
  if (!row) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  res.json({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
  });
});

// POST /api/v1/assets — 创建成果记录
router.post('/', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const { task_id, session_id, agent_id, type, name, path, size, mime_type, metadata } = req.body;

  if (!task_id || !agent_id || !type || !name || !path) {
    return res.status(400).json({ error: 'task_id, agent_id, type, name, and path are required' });
  }

  const id = uuid();
  const now = new Date().toISOString();
  const stmt = db.db.prepare(`
    INSERT INTO executor_work_assets (id, task_id, session_id, agent_id, type, name, path, size, mime_type, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    task_id,
    session_id || null,
    agent_id,
    type,
    name,
    path,
    size || null,
    mime_type || null,
    metadata ? JSON.stringify(metadata) : null,
    now
  );

  const row = db.db.prepare('SELECT * FROM executor_work_assets WHERE id = ?').get(id) as any;
  res.status(201).json({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
  });
});

// DELETE /api/v1/assets/:id — 删除成果记录
router.delete('/:id', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const existing = db.db.prepare('SELECT * FROM executor_work_assets WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  db.db.prepare('DELETE FROM executor_work_assets WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
