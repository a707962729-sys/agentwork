/**
 * Agent API 路由
 */

import { Router, Request, Response } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import * as fs from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();

// Agent 配置目录
const agentsDir = join(__dirname, '..', '..', 'agents');

// 获取 Agent 列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const files = await fs.readdir(agentsDir);
    const agents = [];
    
    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const content = await fs.readFile(join(agentsDir, file), 'utf-8');
        const config = parseYaml(content);
        agents.push({
          id: config.id,
          name: config.name,
          description: config.description,
          model: config.model,
          skills: config.skills,
          status: 'idle'
        });
      }
    }
    
    res.json({ agents, total: agents.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个 Agent
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const files = await fs.readdir(agentsDir);
    
    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const content = await fs.readFile(join(agentsDir, file), 'utf-8');
        const config = parseYaml(content);
        
        if (config.id === req.params.id) {
          return res.json({
            ...config,
            status: 'idle'
          });
        }
      }
    }
    
    res.status(404).json({ error: 'Agent not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;