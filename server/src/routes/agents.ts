/**
 * Agent / Employee API 路由
 */

import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import * as fs from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

// Agent 配置目录
const agentsDir = join(__dirname, '..', '..', 'agents');

// ============================================================
// 旧版 Agent CRUD（保留兼容）
// ============================================================

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

// ============================================================
// 数字员工 (Employee) 管理 — 必须放在 /:id 之前！
// ============================================================

// 初始化员工 mock 数据（单例）
let employeesMockData: any[] | null = null;

function getEmployeesData(): any[] {
  if (!employeesMockData) {
    employeesMockData = [
      {
        id: 'emp-001',
        name: '小数',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoshu',
        role: 'data_processor',
        employmentType: 'full',
        status: 'working',
        skills: ['skill-data-clean', 'skill-etl'],
        workflows: ['wf-data-pipeline'],
        currentTask: 'task-001',
        progress: 65,
        createdAt: '2026-03-01T08:00:00Z'
      },
      {
        id: 'emp-002',
        name: '小文',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaowen',
        role: 'writer',
        employmentType: 'full',
        status: 'idle',
        skills: ['skill-copywrite', 'skill-seo'],
        workflows: ['wf-content-gen'],
        currentTask: undefined,
        progress: 0,
        createdAt: '2026-03-05T09:00:00Z'
      },
      {
        id: 'emp-003',
        name: '小服',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaofu',
        role: 'customer_service',
        employmentType: 'part',
        status: 'pending',
        skills: ['skill-qa-auto'],
        workflows: [],
        currentTask: undefined,
        progress: 0,
        createdAt: '2026-03-10T10:00:00Z'
      },
      {
        id: 'emp-004',
        name: '小报',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaobao',
        role: 'reporter',
        employmentType: 'manual',
        status: 'idle',
        skills: ['skill-report-gen'],
        workflows: ['wf-weekly-report'],
        currentTask: undefined,
        progress: 0,
        createdAt: '2026-03-15T11:00:00Z'
      }
    ];
  }
  return employeesMockData;
}

// GET /api/v1/employees
router.get('/employees', (req: Request, res: Response) => {
  const employees = getEmployeesData();
  res.json({ employees, total: employees.length });
});

// GET /api/v1/employees/:id
router.get('/employees/:id', (req: Request, res: Response) => {
  const employees = getEmployeesData();
  const employee = employees.find(e => e.id === req.params.id);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  res.json(employee);
});

// POST /api/v1/employees
router.post('/employees', (req: Request, res: Response) => {
  const { name, avatar, role, employmentType, skills, workflows } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: 'name and role are required' });
  }
  const employees = getEmployeesData();
  const newEmployee = {
    id: `emp-${uuid()}`,
    name,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    role,
    employmentType: employmentType || 'full',
    status: 'pending',
    skills: skills || [],
    workflows: workflows || [],
    currentTask: undefined,
    progress: 0,
    createdAt: new Date().toISOString()
  };
  employees.push(newEmployee);
  res.status(201).json(newEmployee);
});

// PUT /api/v1/employees/:id
router.put('/employees/:id', (req: Request, res: Response) => {
  const employees = getEmployeesData();
  const idx = employees.findIndex(e => e.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  const { name, avatar, role, employmentType, status, skills, workflows, currentTask, progress } = req.body;
  const emp = employees[idx];
  if (name !== undefined) emp.name = name;
  if (avatar !== undefined) emp.avatar = avatar;
  if (role !== undefined) emp.role = role;
  if (employmentType !== undefined) emp.employmentType = employmentType;
  if (status !== undefined) emp.status = status;
  if (skills !== undefined) emp.skills = skills;
  if (workflows !== undefined) emp.workflows = workflows;
  if (currentTask !== undefined) emp.currentTask = currentTask;
  if (progress !== undefined) emp.progress = progress;
  employees[idx] = emp;
  res.json(emp);
});

// DELETE /api/v1/employees/:id
router.delete('/employees/:id', (req: Request, res: Response) => {
  const employees = getEmployeesData();
  const idx = employees.findIndex(e => e.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  employees.splice(idx, 1);
  res.json({ success: true });
});

// ============================================================
// 单个 Agent — 放在最后（/:id 是 catch-all）
// ============================================================

// GET /api/v1/agents/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const files = await fs.readdir(agentsDir);
    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const content = await fs.readFile(join(agentsDir, file), 'utf-8');
        const config = parseYaml(content);
        if (config.id === req.params.id) {
          return res.json({ ...config, status: 'idle' });
        }
      }
    }
    res.status(404).json({ error: 'Agent not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
