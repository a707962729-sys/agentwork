/**
 * 工作流 API 路由（扩展版）
 */

import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import type { DatabaseManager } from '../../../dist/db/index.js';

const router = Router();

// GET /api/v1/workflows — 列表
router.get('/', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const rows = db.db.prepare('SELECT * FROM workflows ORDER BY installed_at DESC').all() as any[];

  const workflows = rows.map(row => {
    const def = row.definition ? JSON.parse(row.definition) : {};
    const meta = def.metadata || {};
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      version: row.version || '1.0.0',
      source: 'official',
      category: meta.category || '自定义',
      steps: meta.steps?.length || def.steps?.length || 0,
      usedBy: 0,
      installed_at: row.installed_at,
    };
  });

  res.json({ workflows, total: workflows.length });
});

// GET /api/v1/workflows/market — 市场视图
router.get('/market', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const { source, category } = req.query;

  let rows = db.db.prepare('SELECT * FROM workflows ORDER BY installed_at DESC').all() as any[];

  let workflows = rows.map(row => {
    const def = row.definition ? JSON.parse(row.definition) : {};
    const meta = def.metadata || {};
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      version: row.version || '1.0.0',
      source: 'official',
      category: meta.category || '自定义',
      tags: meta.tags || [],
      steps: meta.steps?.length || def.steps?.length || 0,
      usedBy: 0,
      author: meta.author || '',
      installed_at: row.installed_at,
    };
  });

  if (source && ['official', 'developer'].includes(source as string)) {
    workflows = workflows.filter(w => w.source === source);
  }
  if (category) {
    workflows = workflows.filter(w => w.category === category);
  }

  const categories = [...new Set(workflows.map(w => w.category))];
  res.json({
    workflows,
    total: workflows.length,
    categories,
    summary: {
      official: workflows.filter(w => w.source === 'official').length,
      developer: workflows.filter(w => w.source === 'developer').length,
    }
  });
});

// 获取单个工作流
router.get('/:id', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const row = db.db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as any;

  if (!row) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const def = row.definition ? JSON.parse(row.definition) : {};
  const meta = def.metadata || {};
  res.json({
    id: row.id,
    name: row.name,
    description: row.description || '',
    version: row.version || '1.0.0',
    source: 'official',
    category: meta.category || '自定义',
    tags: meta.tags || [],
    definition: def,
    installed_at: row.installed_at,
  });
});

// POST /api/v1/workflows — 创建工作流
router.post('/', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const { name, description, version, definition } = req.body;

  if (!name || !definition) {
    return res.status(400).json({ error: 'name and definition are required' });
  }

  const id = uuid() || name.toLowerCase().replace(/\s+/g, '-');
  const now = new Date().toISOString();
  const stmt = db.db.prepare(`
    INSERT INTO workflows (id, name, description, version, definition, installed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    name,
    description || '',
    version || '1.0.0',
    JSON.stringify(definition),
    now
  );

  const row = db.db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) as any;
  const def = row.definition ? JSON.parse(row.definition) : {};
  res.status(201).json({
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    definition: def,
    installed_at: row.installed_at,
  });
});

// PUT /api/v1/workflows/:id — 更新工作流
router.put('/:id', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const existing = db.db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Workflow not found' });

  const { name, description, version, definition } = req.body;
  const now = new Date().toISOString();

  const stmt = db.db.prepare(`
    UPDATE workflows SET name = ?, description = ?, version = ?, definition = ?, installed_at = ?
    WHERE id = ?
  `);
  stmt.run(
    name ?? existing.name,
    description ?? existing.description,
    version ?? existing.version,
    definition ? JSON.stringify(definition) : existing.definition,
    now,
    req.params.id
  );

  const row = db.db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as any;
  const def = row.definition ? JSON.parse(row.definition) : {};
  res.json({
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    definition: def,
    installed_at: row.installed_at,
  });
});

// DELETE /api/v1/workflows/:id — 删除工作流
router.delete('/:id', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const existing = db.db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Workflow not found' });
  db.db.prepare('DELETE FROM workflows WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 运行工作流
router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const workflowEngine = req.app.locals.workflowEngine;
    if (!workflowEngine) {
      return res.status(500).json({ error: 'Workflow engine not available' });
    }
    const inputs = req.body.inputs || {};
    const run = await workflowEngine.run(req.params.id, inputs);
    res.status(201).json(run);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取工作流运行状态
router.get('/:id/runs/:runId', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const row = db.db.prepare('SELECT * FROM workflow_runs WHERE id = ?').get(req.params.runId) as any;

  if (!row) {
    return res.status(404).json({ error: 'Workflow run not found' });
  }

  res.json({
    id: row.id,
    workflowId: row.workflow_id,
    status: row.status,
    inputs: row.inputs ? JSON.parse(row.inputs) : {},
    steps: row.steps ? JSON.parse(row.steps) : [],
    currentStepId: row.current_step_id,
    outputs: row.outputs ? JSON.parse(row.outputs) : undefined,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  });
});

export default router;
