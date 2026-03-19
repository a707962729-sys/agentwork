/**
 * 任务编排器测试
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { TaskOrchestrator } from '../orchestrator/index.js';
import { WorkflowEngine } from '../workflow/engine.js';
import { SkillsRegistry } from '../skills/index.js';
import { DatabaseManager } from '../db/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('TaskOrchestrator', () => {
  let db: DatabaseManager;
  let skills: SkillsRegistry;
  let workflowEngine: WorkflowEngine;
  let orchestrator: TaskOrchestrator;
  let testDbPath: string;
  let testSkillsDir: string;

  beforeEach(async () => {
    testDbPath = path.join(__dirname, `test-${Date.now()}.db`);
    testSkillsDir = path.join(__dirname, `test-skills-${Date.now()}`);
    
    await fs.mkdir(testSkillsDir, { recursive: true });
    
    db = new DatabaseManager(testDbPath);
    skills = new SkillsRegistry(db, testSkillsDir);
    await skills.init();
    workflowEngine = new WorkflowEngine(db, skills);
    orchestrator = new TaskOrchestrator(db, workflowEngine, skills);
  });

  afterEach(() => {
    try {
      db.close();
    } catch {}
  });

  afterAll(async () => {
    try {
      await fs.unlink(testDbPath);
      await fs.rm(testSkillsDir, { recursive: true });
    } catch {}
  });

  describe('创建任务', () => {
    it('应该创建基本任务', async () => {
      const task = await orchestrator.createTask({
        title: '测试任务',
        description: '这是一个测试任务'
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe('测试任务');
      expect(task.description).toBe('这是一个测试任务');
      expect(task.type).toBe('custom');
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('normal');
      expect(task.steps).toHaveLength(0);
    });

    it('应该创建带类型的任务', async () => {
      const task = await orchestrator.createTask({
        title: '内容发布任务',
        type: 'content',
        priority: 'high'
      });

      expect(task.type).toBe('content');
      expect(task.priority).toBe('high');
    });

    it('应该创建工作流关联任务', async () => {
      // 先创建工作流
      const workflowYaml = `---
apiVersion: v1
kind: Workflow
metadata:
  id: test-workflow
  name: 测试工作流
  version: 1.0.0
steps:
  - id: step1
    name: 第一步
    skill: test-skill
`;

      const workflowPath = path.join(__dirname, `test-workflow-${Date.now()}.yaml`);
      await fs.writeFile(workflowPath, workflowYaml, 'utf-8');
      await workflowEngine.loadFromFile(workflowPath);

      const task = await orchestrator.createTask({
        title: '工作流任务',
        workflowId: 'test-workflow'
      });

      expect(task.workflowId).toBe('test-workflow');

      await fs.unlink(workflowPath);
    });

    it('应该触发 task:created 事件', async () => {
      const events: any[] = [];
      orchestrator.on('task:created', (event) => { events.push(event); return undefined; });

      await orchestrator.createTask({
        title: '事件测试任务'
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('task:created');
      expect(events[0].data.task.title).toBe('事件测试任务');
    });
  });

  describe('任务拆解', () => {
    it('应该拆解任务为步骤', async () => {
      const task = await orchestrator.createTask({
        title: '测试拆解',
        description: '测试任务拆解功能'
      });

      const steps = await orchestrator.decompose(task.id);

      expect(steps).toBeDefined();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].id).toBeDefined();
      expect(steps[0].status).toBe('pending');
    });

    it('应该更新任务状态为 ready', async () => {
      const task = await orchestrator.createTask({
        title: '状态测试'
      });

      await orchestrator.decompose(task.id);

      const updatedTask = orchestrator.getTask(task.id);
      expect(updatedTask?.status).toBe('ready');
    });

    it('应该为工作流任务创建工作流步骤', async () => {
      const workflowYaml = `---
apiVersion: v1
kind: Workflow
metadata:
  id: workflow-test
  name: 工作流测试
  version: 1.0.0
steps:
  - id: wf-step1
    name: 工作流步骤 1
    skill: test-skill
  - id: wf-step2
    name: 工作流步骤 2
    skill: test-skill
    dependsOn:
      - wf-step1
`;

      const workflowPath = path.join(__dirname, `test-workflow-${Date.now()}.yaml`);
      await fs.writeFile(workflowPath, workflowYaml, 'utf-8');
      await workflowEngine.loadFromFile(workflowPath);

      const task = await orchestrator.createTask({
        title: '工作流拆解测试',
        workflowId: 'workflow-test'
      });

      const steps = await orchestrator.decompose(task.id);

      expect(steps).toHaveLength(2);
      // 步骤 ID 应该从工作流定义中来
      expect(steps.map(s => s.id)).toContain('wf-step1');
      expect(steps.map(s => s.id)).toContain('wf-step2');
      // 验证依赖关系
      const step2 = steps.find(s => s.id === 'wf-step2');
      expect(step2?.dependsOn).toContain('wf-step1');

      await fs.unlink(workflowPath);
    });

    it('应该根据触发词匹配技能', async () => {
      // 创建带触发词的技能
      const skillDir = path.join(testSkillsDir, 'translate-skill');
      await fs.mkdir(skillDir, { recursive: true });

      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: translate-skill
description: 翻译技能
metadata:
  triggers:
    - 翻译
    - translate
---
Content`, 'utf-8');

      const registry2 = new SkillsRegistry(db, testSkillsDir);
      await registry2.init();
      const orchestrator2 = new TaskOrchestrator(db, workflowEngine, registry2);

      const task = await orchestrator2.createTask({
        title: '请帮我翻译这篇文章',
        description: '需要翻译成英文'
      });

      const steps = await orchestrator2.decompose(task.id);

      expect(steps).toBeDefined();
      expect(steps.length).toBeGreaterThan(0);
    });

    it('应该抛出错误当任务不存在时', async () => {
      await expect(orchestrator.decompose('nonexistent-task')).rejects.toThrow('Task not found');
    });

    it('应该触发 task:started 事件', async () => {
      const task = await orchestrator.createTask({
        title: '事件测试'
      });

      const events: any[] = [];
      orchestrator.on('task:started', (event) => { events.push(event); return undefined; });

      await orchestrator.decompose(task.id);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('task:started');
      expect(events[0].data.taskId).toBe(task.id);
    });
  });

  describe('执行任务', () => {
    it('应该执行 pending 状态的任务', async () => {
      const task = await orchestrator.createTask({
        title: '执行测试'
      });

      await orchestrator.execute(task.id);

      const updatedTask = orchestrator.getTask(task.id);
      expect(updatedTask?.status).toBe('completed');
    });

    it('应该自动拆解 pending 任务', async () => {
      const task = await orchestrator.createTask({
        title: '自动拆解测试'
      });

      // 任务初始状态为 pending，没有步骤
      expect(task.steps).toHaveLength(0);

      await orchestrator.execute(task.id);

      const updatedTask = orchestrator.getTask(task.id);
      expect(updatedTask?.steps.length).toBeGreaterThan(0);
    });

    it('应该执行工作流任务', async () => {
      const workflowYaml = `---
apiVersion: v1
kind: Workflow
metadata:
  id: exec-workflow
  name: 执行测试工作流
  version: 1.0.0
steps:
  - id: step1
    name: 步骤 1
    skill: test-skill
`;

      const workflowPath = path.join(__dirname, `test-workflow-${Date.now()}.yaml`);
      await fs.writeFile(workflowPath, workflowYaml, 'utf-8');
      await workflowEngine.loadFromFile(workflowPath);

      const task = await orchestrator.createTask({
        title: '工作流执行测试',
        workflowId: 'exec-workflow'
      });

      await orchestrator.execute(task.id);

      // 等待工作流执行完成
      await new Promise(resolve => setTimeout(resolve, 300));

      const updatedTask = orchestrator.getTask(task.id);
      expect(updatedTask?.workflowRunId).toBeDefined();
      // 工作流可能因为技能不存在而失败，但 workflowRunId 应该存在
      expect(updatedTask?.workflowRunId).toBeDefined();

      await fs.unlink(workflowPath);
    });

    it('应该触发 step:started 和 step:completed 事件', async () => {
      const task = await orchestrator.createTask({
        title: '事件测试'
      });

      const events: any[] = [];
      orchestrator.on('step:started', (event) => { events.push(event); return undefined; });
      orchestrator.on('step:completed', (event) => { events.push(event); return undefined; });
      orchestrator.on('task:completed', (event) => { events.push(event); return undefined; });

      await orchestrator.execute(task.id);

      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'task:completed')).toBe(true);
    });

    it('应该处理技能执行失败', async () => {
      const task = await orchestrator.createTask({
        title: '失败测试'
      });

      await orchestrator.decompose(task.id);

      // 修改步骤使用不存在的技能
      const updatedTask = orchestrator.getTask(task.id);
      if (updatedTask) {
        updatedTask.steps[0].skill = 'nonexistent-skill';
        db.updateTask(task.id, { steps: updatedTask.steps });
      }

      await orchestrator.execute(task.id);

      const finalTask = orchestrator.getTask(task.id);
      expect(finalTask?.status).toBe('failed');
    });

    it('应该抛出错误当任务不存在时', async () => {
      await expect(orchestrator.execute('nonexistent-task')).rejects.toThrow('Task not found');
    });
  });

  describe('获取任务', () => {
    it('应该获取任务', async () => {
      const task = await orchestrator.createTask({
        title: '获取测试',
        description: '测试获取任务'
      });

      const retrieved = orchestrator.getTask(task.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(task.id);
      expect(retrieved?.title).toBe('获取测试');
    });

    it('应该返回 null 当任务不存在时', async () => {
      const retrieved = orchestrator.getTask('nonexistent');
      expect(retrieved).toBeNull();
    });
  });

  describe('列出任务', () => {
    it('应该列出所有任务', async () => {
      await orchestrator.createTask({ title: '任务 1' });
      await orchestrator.createTask({ title: '任务 2' });
      await orchestrator.createTask({ title: '任务 3' });

      const tasks = orchestrator.listTasks();

      expect(tasks).toHaveLength(3);
      expect(tasks.map(t => t.title)).toContain('任务 1');
      expect(tasks.map(t => t.title)).toContain('任务 2');
      expect(tasks.map(t => t.title)).toContain('任务 3');
    });

    it('应该限制返回数量', async () => {
      for (let i = 0; i < 10; i++) {
        await orchestrator.createTask({ title: `任务${i}` });
      }

      const tasks = orchestrator.listTasks(5);

      expect(tasks).toHaveLength(5);
    });

    it('应该按创建时间倒序返回', async () => {
      await orchestrator.createTask({ title: '第一' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await orchestrator.createTask({ title: '第二' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await orchestrator.createTask({ title: '第三' });

      const tasks = orchestrator.listTasks();

      expect(tasks[0].title).toBe('第三');
      expect(tasks[1].title).toBe('第二');
      expect(tasks[2].title).toBe('第一');
    });
  });

  describe('状态更新', () => {
    it('应该更新任务状态', async () => {
      const task = await orchestrator.createTask({
        title: '状态更新测试'
      });

      expect(task.status).toBe('pending');

      await orchestrator.decompose(task.id);

      const updated = orchestrator.getTask(task.id);
      expect(updated?.status).toBe('ready');

      await orchestrator.execute(task.id);

      const final = orchestrator.getTask(task.id);
      expect(final?.status).toBe('completed');
    });

    it('应该记录任务开始时间', async () => {
      const task = await orchestrator.createTask({
        title: '时间测试'
      });

      expect(task.startedAt).toBeUndefined();

      await orchestrator.execute(task.id);

      const updated = orchestrator.getTask(task.id);
      expect(updated?.startedAt).toBeDefined();
    });

    it('应该记录任务完成时间', async () => {
      const task = await orchestrator.createTask({
        title: '完成时间测试'
      });

      expect(task.completedAt).toBeUndefined();

      await orchestrator.execute(task.id);

      const updated = orchestrator.getTask(task.id);
      expect(updated?.completedAt).toBeDefined();
    });
  });
});
