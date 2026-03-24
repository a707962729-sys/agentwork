/**
 * Employee API 路由
 * 挂载在 /api/v1/employees
 */

import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import type { DatabaseManager } from '../../../dist/db/index.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const rows = db.db.prepare('SELECT * FROM executor_agents ORDER BY created_at DESC').all() as any[];
  const employees = rows.map(row => ({
    ...row,
    tools: row.tools ? JSON.parse(row.tools) : [],
    skills: row.skills ? JSON.parse(row.skills) : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
  res.json({ employees, total: employees.length });
});

router.get('/:id', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const row = db.db.prepare('SELECT * FROM executor_agents WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'Employee not found' });
  res.json({
    ...row,
    tools: row.tools ? JSON.parse(row.tools) : [],
    skills: row.skills ? JSON.parse(row.skills) : [],
  });
});

router.post('/', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const { name, description, model, model_type, api_key, base_url, max_tokens, temperature, system_prompt, tools, skills, experience_id, concurrent_limit, status } = req.body;
  if (!name || !model) return res.status(400).json({ error: 'name and model are required' });

  const id = uuid();
  const now = new Date().toISOString();
  const stmt = db.db.prepare(`
    INSERT INTO executor_agents (id, name, description, model, model_type, api_key, base_url, max_tokens, temperature, system_prompt, tools, skills, experience_id, concurrent_limit, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    name,
    description || '',
    model,
    model_type || 'openai',
    api_key || null,
    base_url || null,
    max_tokens || 4096,
    temperature || 0.7,
    system_prompt || null,
    JSON.stringify(tools || []),
    JSON.stringify(skills || []),
    experience_id || null,
    concurrent_limit || 3,
    status || 'idle',
    now,
    now
  );

  const row = db.db.prepare('SELECT * FROM executor_agents WHERE id = ?').get(id) as any;
  res.status(201).json({
    ...row,
    tools: row.tools ? JSON.parse(row.tools) : [],
    skills: row.skills ? JSON.parse(row.skills) : [],
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const existing = db.db.prepare('SELECT * FROM executor_agents WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Employee not found' });

  const { name, description, model, model_type, api_key, base_url, max_tokens, temperature, system_prompt, tools, skills, experience_id, concurrent_limit, status } = req.body;
  const now = new Date().toISOString();

  const stmt = db.db.prepare(`
    UPDATE executor_agents SET
      name = ?, description = ?, model = ?, model_type = ?, api_key = ?, base_url = ?,
      max_tokens = ?, temperature = ?, system_prompt = ?, tools = ?, skills = ?,
      experience_id = ?, concurrent_limit = ?, status = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(
    name ?? existing.name,
    description ?? existing.description,
    model ?? existing.model,
    model_type ?? existing.model_type,
    api_key ?? existing.api_key,
    base_url ?? existing.base_url,
    max_tokens ?? existing.max_tokens,
    temperature ?? existing.temperature,
    system_prompt ?? existing.system_prompt,
    tools !== undefined ? JSON.stringify(tools) : existing.tools,
    skills !== undefined ? JSON.stringify(skills) : existing.skills,
    experience_id ?? existing.experience_id,
    concurrent_limit ?? existing.concurrent_limit,
    status ?? existing.status,
    now,
    req.params.id
  );

  const row = db.db.prepare('SELECT * FROM executor_agents WHERE id = ?').get(req.params.id) as any;
  res.json({
    ...row,
    tools: row.tools ? JSON.parse(row.tools) : [],
    skills: row.skills ? JSON.parse(row.skills) : [],
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const existing = db.db.prepare('SELECT * FROM executor_agents WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Employee not found' });
  db.db.prepare('DELETE FROM executor_agents WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
