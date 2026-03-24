/**
 * 技能 API 路由（扩展版）
 */

import { Router, Request, Response } from 'express';
import type { DatabaseManager } from '../../../dist/db/index.js';

const router = Router();

// GET /api/v1/skills/market — 市场视图
router.get('/market', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const { source, category } = req.query;

  let rows = db.db.prepare('SELECT * FROM skills ORDER BY installed_at DESC').all() as any[];

  // 解析 manifest，提取 category, description, source 等字段
  let skills = rows.map(row => {
    const manifest = row.manifest ? JSON.parse(row.manifest) : {};
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      description: manifest.description || '',
      category: manifest.category || '其他',
      source: manifest.source || 'developer',
      version: manifest.version || '1.0.0',
      author: manifest.author || '',
      downloads: 0,
      installed_at: row.installed_at,
    };
  });

  if (source && ['official', 'developer'].includes(source as string)) {
    skills = skills.filter(s => s.source === source);
  }
  if (category) {
    skills = skills.filter(s => s.category === category);
  }

  // 构建 categories 列表（从所有已安装技能）
  const allSkills = rows.map(row => {
    const manifest = row.manifest ? JSON.parse(row.manifest) : {};
    return { category: manifest.category || '其他', source: manifest.source || 'developer' };
  });
  const categories = [...new Set(allSkills.map(s => s.category))];

  res.json({
    skills,
    total: skills.length,
    categories,
    summary: {
      official: allSkills.filter(s => s.source === 'official').length,
      developer: allSkills.filter(s => s.source === 'developer').length,
    }
  });
});

// 获取技能列表（本地已安装）
router.get('/', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const rows = db.db.prepare('SELECT * FROM skills ORDER BY installed_at DESC').all() as any[];
  const skills = rows.map(row => {
    const manifest = row.manifest ? JSON.parse(row.manifest) : {};
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      description: manifest.description || '',
      category: manifest.category || '其他',
      source: manifest.source || 'developer',
      version: manifest.version || '1.0.0',
      installed_at: row.installed_at,
    };
  });
  res.json({ skills, total: skills.length });
});

// 搜索技能
router.get('/search', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const query = req.query.q as string;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const rows = db.db.prepare('SELECT * FROM skills ORDER BY installed_at DESC').all() as any[];
  const q = query.toLowerCase();
  const results = rows
    .map(row => {
      const manifest = row.manifest ? JSON.parse(row.manifest) : {};
      return {
        id: row.id,
        name: row.name,
        path: row.path,
        description: manifest.description || '',
        category: manifest.category || '其他',
        source: manifest.source || 'developer',
        version: manifest.version || '1.0.0',
      };
    })
    .filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));

  res.json({ skills: results, total: results.length });
});

// 获取单个技能
router.get('/:name', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const row = db.db.prepare('SELECT * FROM skills WHERE name = ?').get(req.params.name) as any;

  if (!row) {
    return res.status(404).json({ error: 'Skill not found' });
  }

  const manifest = row.manifest ? JSON.parse(row.manifest) : {};
  res.json({
    id: row.id,
    name: row.name,
    path: row.path,
    description: manifest.description || '',
    category: manifest.category || '其他',
    source: manifest.source || 'developer',
    version: manifest.version || '1.0.0',
    author: manifest.author || '',
    content: row.content || '',
    installed_at: row.installed_at,
  });
});

// GET /api/v1/skills/:name/config — 获取技能配置
router.get('/:name/config', (req: Request, res: Response) => {
  const db = req.app.locals.db as DatabaseManager;
  const row = db.db.prepare('SELECT * FROM skills WHERE name = ?').get(req.params.name) as any;

  if (!row) {
    return res.status(404).json({ error: 'Skill not found' });
  }

  const manifest = row.manifest ? JSON.parse(row.manifest) : {};
  const config = {
    name: row.name,
    description: manifest.description || '',
    version: manifest.version || '1.0.0',
    category: manifest.category || '其他',
    source: manifest.source || 'developer',
    config: manifest.config || {},
    parameters: manifest.parameters || [],
    prompts: manifest.prompts || {},
    files: manifest.files || [],
  };

  res.json(config);
});

// 安装技能（通过 skills registry）
router.post('/install', async (req: Request, res: Response) => {
  try {
    const skills = req.app.locals.skills;
    if (!skills) {
      return res.status(500).json({ error: 'Skills registry not available' });
    }
    const { source } = req.body;
    if (!source) {
      return res.status(400).json({ error: 'Source is required' });
    }
    const skill = await skills.install(source);
    res.status(201).json(skill);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 卸载技能
router.delete('/:name', async (req: Request, res: Response) => {
  try {
    const skills = req.app.locals.skills;
    if (!skills) {
      return res.status(500).json({ error: 'Skills registry not available' });
    }
    await skills.uninstall(req.params.name);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
