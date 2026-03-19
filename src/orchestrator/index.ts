/**
 * 任务编排器
 */

import { Task, TaskStep, TaskType, TaskStatus, Event, EventHandler } from '../types.js';
import { DatabaseManager } from '../db/index.js';
import { WorkflowEngine } from '../workflow/engine.js';
import { SkillsRegistry } from '../skills/index.js';
import { v4 as uuid } from 'uuid';

export class TaskOrchestrator {
  private db: DatabaseManager;
  private workflowEngine: WorkflowEngine;
  private skills: SkillsRegistry;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  constructor(db: DatabaseManager, workflowEngine: WorkflowEngine, skills: SkillsRegistry) {
    this.db = db;
    this.workflowEngine = workflowEngine;
    this.skills = skills;
  }

  /**
   * 创建任务
   */
  async createTask(input: {
    title: string;
    description?: string;
    type?: TaskType;
    priority?: 'high' | 'normal' | 'low';
    workflowId?: string;
  }): Promise<Task> {
    const task = this.db.createTask({
      title: input.title,
      description: input.description || '',
      type: input.type || 'custom',
      status: 'pending',
      priority: input.priority || 'normal',
      workflowId: input.workflowId,
      steps: []
    });

    this.emit({ type: 'task:created', data: { task }, timestamp: new Date() });

    return task;
  }

  /**
   * AI 驱动的任务拆解
   */
  async decompose(taskId: string): Promise<TaskStep[]> {
    const task = this.db.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // 更新状态
    this.db.updateTask(taskId, { status: 'decomposing' });

    // 匹配相关技能
    const matchedSkills = this.skills.matchByTrigger(task.title + ' ' + task.description);

    // 根据任务类型选择工作流
    let workflow = task.workflowId ? this.workflowEngine.getWorkflow(task.workflowId) : null;

    if (!workflow) {
      // 尝试自动匹配工作流
      workflow = this.matchWorkflow(task.type, matchedSkills);
    }

    let steps: TaskStep[] = [];

    if (workflow) {
      // 使用工作流定义的步骤
      steps = workflow.steps.map((step, index) => ({
        id: step.id,
        orderId: index,
        title: step.name,
        skill: step.skill,
        agent: step.agent,
        status: 'pending' as const,
        input: step.input,
        dependsOn: step.dependsOn || [],
        checkpoint: step.checkpoint,
        retryCount: 0,
        maxRetries: step.retry ?? 3
      }));

      task.workflowId = workflow.metadata.id;
    } else {
      // AI 拆解（简化版）
      steps = await this.aiDecompose(task, matchedSkills);
    }

    // 更新任务
    this.db.updateTask(taskId, {
      status: 'ready',
      steps,
      workflowId: task.workflowId
    });

    this.emit({ type: 'task:started', data: { taskId, steps }, timestamp: new Date() });

    return steps;
  }

  /**
   * 匹配工作流
   */
  private matchWorkflow(taskType: TaskType, matchedSkills: any[]): any {
    const workflows = this.workflowEngine.listWorkflows();

    // 根据任务类型匹配
    const typeWorkflowMap: Record<string, string> = {
      'content': 'content-publish',
      'dev': 'dev-pipeline',
      'analysis': 'data-analysis'
    };

    const targetId = typeWorkflowMap[taskType];
    if (targetId) {
      return workflows.find(w => w.metadata.id === targetId);
    }

    return null;
  }

  /**
   * AI 拆解任务
   */
  private async aiDecompose(task: Task, matchedSkills: any[]): Promise<TaskStep[]> {
    // 这里应该调用 AI 进行拆解
    // 简化版本：根据匹配的技能创建步骤

    const skills = matchedSkills.length > 0 ? matchedSkills : this.skills.list().slice(0, 3);

    return skills.map((skill, index) => ({
      id: `step-${index + 1}`,
      orderId: index,
      title: skill.manifest.name,
      description: skill.manifest.description,
      skill: skill.manifest.name,
      status: 'pending' as const,
      dependsOn: index > 0 ? [`step-${index}`] : [],
      retryCount: 0,
      maxRetries: 3
    }));
  }

  /**
   * 执行任务
   */
  async execute(taskId: string): Promise<void> {
    const task = this.db.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status === 'pending') {
      await this.decompose(taskId);
    }

    // 更新状态
    this.db.updateTask(taskId, { status: 'running', startedAt: new Date() });

    // 如果有工作流，运行工作流
    if (task.workflowId) {
      const run = await this.workflowEngine.run(task.workflowId, {
        title: task.title,
        description: task.description,
        type: task.type
      });

      this.db.updateTask(taskId, { workflowRunId: run.id });
    } else {
      // 直接执行步骤
      await this.executeSteps(taskId);
    }
  }

  /**
   * 执行步骤
   */
  private async executeSteps(taskId: string): Promise<void> {
    const task = this.db.getTask(taskId);
    if (!task) return;

    for (const step of task.steps) {
      if (step.status !== 'pending') continue;

      step.status = 'running';
      step.startedAt = new Date();
      this.db.updateTask(taskId, { steps: task.steps });

      this.emit({ type: 'step:started', data: { taskId, stepId: step.id }, timestamp: new Date() });

      try {
        const skill = await this.skills.load(step.skill);
        if (skill) {
          // 执行技能
          step.output = { success: true, skill: skill.manifest.name };
          step.status = 'passed';
        } else {
          throw new Error(`Skill not found: ${step.skill}`);
        }
      } catch (error: any) {
        step.status = 'failed';
        step.error = error.message;
        this.db.updateTask(taskId, { steps: task.steps, status: 'failed', error: error.message });
        this.emit({ type: 'step:failed', data: { taskId, stepId: step.id, error: error.message }, timestamp: new Date() });
        return;
      }

      step.completedAt = new Date();
      this.db.updateTask(taskId, { steps: task.steps });
      this.emit({ type: 'step:completed', data: { taskId, stepId: step.id }, timestamp: new Date() });
    }

    // 完成
    this.db.updateTask(taskId, { status: 'completed', completedAt: new Date() });
    this.emit({ type: 'task:completed', data: { taskId }, timestamp: new Date() });
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): Task | null {
    return this.db.getTask(taskId);
  }

  /**
   * 列出任务
   */
  listTasks(limit = 50): Task[] {
    return this.db.listTasks(limit);
  }

  /**
   * 事件监听
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * 触发事件
   */
  private emit(event: Event): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }
}