/**
 * 技能 API 路由
 */

import { Router, Request, Response } from 'express';

const router = Router();

// 获取技能列表
router.get('/', (req: Request, res: Response) => {
  const skills = req.app.locals.skills;
  const skillList = skills.list();
  res.json({ skills: skillList, total: skillList.length });
});

// 搜索技能
router.get('/search', (req: Request, res: Response) => {
  const skills = req.app.locals.skills;
  const query = req.query.q as string;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  
  const results = skills.search(query);
  res.json({ skills: results, total: results.length });
});

// 获取单个技能
router.get('/:name', async (req: Request, res: Response) => {
  const skills = req.app.locals.skills;
  const skill = await skills.load(req.params.name);
  
  if (!skill) {
    return res.status(404).json({ error: 'Skill not found' });
  }
  
  res.json(skill);
});

// 安装技能
router.post('/install', async (req: Request, res: Response) => {
  try {
    const skills = req.app.locals.skills;
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
    await skills.uninstall(req.params.name);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;