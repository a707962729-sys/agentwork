/**
 * 工作流引擎
 */

import { parse as parseYaml } from 'yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  WorkflowDefinition, 
  WorkflowRun, 
  WorkflowStep, 
  TaskStep,
  CheckpointResult,
  Event,
  EventHandler
} from '../types.js';
import { DatabaseManager } from '../db/index.js';
import { expandHome, evaluateExpression, ensureDir } from '../utils.js';
import { CheckpointManager } from './checkpoint.js';
import { SkillsRegistry } from '../skills/index.js';

export class WorkflowEngine {
  private db: DatabaseManager;
  private checkpoint: CheckpointManager;
  private skills: SkillsRegistry;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private runningWorkflows: Map<string, Promise<void>> = new Map();

  constructor(db: DatabaseManager, skills: SkillsRegistry) {
    this.db = db;
    this.skills = skills;
    this.checkpoint = new CheckpointManager();
  }

  /**
   * 从文件加载工作流定义
   */
  async loadFromFile(filepath: string): Promise<WorkflowDefinition> {
    const expandedPath = expandHome(filepath);
    const content = await fs.readFile(expandedPath, 'utf-8');
    const definition = parseYaml(content) as WorkflowDefinition;

    // 验证定义
    this.validateDefinition(definition);

    // 保存到数据库
    this.db.saveWorkflow(definition);

    return definition;
  }

  /**
   * 验证工作流定义
   */
  private validateDefinition(definition: WorkflowDefinition): void {
    if (!definition.metadata?.id) {
      throw new Error('Workflow must have metadata.id');
    }
    if (!definition.metadata?.name) {
      throw new Error('Workflow must have metadata.name');
    }
    if (!definition.steps || definition.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // 验证步骤 ID 唯一
    const stepIds = new Set<string>();
    for (const step of definition.steps) {
      if (stepIds.has(step.id)) {
        throw new Error(`Duplicate step id: ${step.id}`);
      }
      stepIds.add(step.id);
    }

    // 验证依赖关系
    for (const step of definition.steps) {
      for (const dep of step.dependsOn || []) {
        if (!stepIds.has(dep)) {
          throw new Error(`Step ${step.id} depends on non-existent step: ${dep}`);
        }
      }
    }
  }

  /**
   * 获取工作流定义
   */
  getWorkflow(id: string): WorkflowDefinition | null {
    return this.db.getWorkflow(id);
  }

  /**
   * 列出所有工作流
   */
  listWorkflows(): WorkflowDefinition[] {
    return this.db.listWorkflows();
  }

  /**
   * 运行工作流
   */
  async run(workflowId: string, inputs: Record<string, any> = {}): Promise<WorkflowRun> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // 创建运行实例
    const steps = this.createTaskSteps(workflow.steps);
    const run = this.db.createWorkflowRun({
      workflowId,
      status: 'pending',
      inputs,
      steps
    });

    // 触发事件
    this.emit({ type: 'workflow:started', data: { runId: run.id, workflowId }, timestamp: new Date() });

    // 异步执行
    const promise = this.executeRun(run.id, workflow, inputs);
    this.runningWorkflows.set(run.id, promise);

    promise
      .then(() => this.runningWorkflows.delete(run.id))
      .catch(() => this.runningWorkflows.delete(run.id));

    return run;
  }

  /**
   * 创建任务步骤
   */
  private createTaskSteps(workflowSteps: WorkflowStep[]): TaskStep[] {
    return workflowSteps.map((step, index) => ({
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
      maxRetries: step.retry ?? step.checkpoint?.maxRetries ?? 3
    }));
  }

  /**
   * 执行工作流运行
   */
  private async executeRun(runId: string, workflow: WorkflowDefinition, inputs: Record<string, any>): Promise<void> {
    let run = this.db.getWorkflowRun(runId)!;
    run.status = 'running';
    run.startedAt = new Date();
    this.db.updateWorkflowRun(runId, { status: 'running', startedAt: run.startedAt });

    const context: Record<string, any> = { inputs, steps: {} };

    try {
      // 按依赖顺序执行
      const sortedSteps = this.topologicalSort(run.steps);

      for (const step of sortedSteps) {
        // 更新当前步骤
        run = this.db.getWorkflowRun(runId)!;
        run.currentStepId = step.id;
        this.db.updateWorkflowRun(runId, { currentStepId: step.id });

        // 执行步骤
        await this.executeStep(runId, step, context, workflow);

        // 更新运行中的步骤
        run = this.db.getWorkflowRun(runId)!;
        const updatedSteps = run.steps.map((s: TaskStep) => s.id === step.id ? step : s);
        this.db.updateWorkflowRun(runId, { steps: updatedSteps });
      }

      // 完成工作流
      run = this.db.getWorkflowRun(runId)!;
      run.status = 'completed';
      run.completedAt = new Date();

      // 计算输出
      if (workflow.outputs) {
        const outputs: Record<string, any> = {};
        for (const [key, expr] of Object.entries(workflow.outputs)) {
          outputs[key] = evaluateExpression(expr, context);
        }
        run.outputs = outputs;
      }

      this.db.updateWorkflowRun(runId, {
        status: 'completed',
        completedAt: run.completedAt,
        outputs: run.outputs
      });

      this.emit({ type: 'workflow:completed', data: { runId, outputs: run.outputs }, timestamp: new Date() });

    } catch (error: any) {
      run = this.db.getWorkflowRun(runId)!;
      run.status = 'failed';
      run.error = error.message;
      run.completedAt = new Date();

      this.db.updateWorkflowRun(runId, {
        status: 'failed',
        error: run.error,
        completedAt: run.completedAt
      });

      this.emit({ type: 'workflow:completed', data: { runId, error: error.message }, timestamp: new Date() });

      throw error;
    }
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(
    runId: string, 
    step: TaskStep, 
    context: Record<string, any>,
    workflow: WorkflowDefinition
  ): Promise<void> {
    step.status = 'running';
    step.startedAt = new Date();

    this.emit({ type: 'step:started', data: { runId, stepId: step.id, title: step.title }, timestamp: new Date() });

    try {
      // 解析输入参数
      const resolvedInput: Record<string, any> = {};
      if (step.input) {
        for (const [key, value] of Object.entries(step.input)) {
          if (typeof value === 'string') {
            resolvedInput[key] = evaluateExpression(value, context);
          } else {
            resolvedInput[key] = value;
          }
        }
      }

      // 获取技能
      const skill = await this.skills.load(step.skill);
      if (!skill) {
        throw new Error(`Skill not found: ${step.skill}`);
      }

      // 执行技能（这里简化处理，实际应该调用 Agent）
      step.output = await this.executeSkill(skill, resolvedInput);

      // 检查点验证
      if (step.checkpoint) {
        const result = await this.checkpoint.validate(step, step.output, context);
        step.checkpointResult = result;

        if (!result.passed) {
          if (result.requireApproval) {
            // 需要人工确认
            step.status = 'pending';
            this.emit({ 
              type: 'checkpoint:pending_approval', 
              data: { runId, stepId: step.id, message: result.message },
              timestamp: new Date()
            });
            return;
          }

          // 验证失败
          throw new Error(result.message || 'Checkpoint validation failed');
        }
      }

      step.status = 'passed';
      step.completedAt = new Date();
      context.steps[step.id] = step.output;

      this.emit({ type: 'step:completed', data: { runId, stepId: step.id, output: step.output }, timestamp: new Date() });

    } catch (error: any) {
      step.status = 'failed';
      step.error = error.message;
      step.completedAt = new Date();

      // 重试逻辑
      if (step.retryCount < step.maxRetries) {
        step.retryCount++;
        step.status = 'pending';
        this.emit({ type: 'step:failed', data: { runId, stepId: step.id, error: error.message, retrying: true }, timestamp: new Date() });
        await this.executeStep(runId, step, context, workflow);
        return;
      }

      this.emit({ type: 'step:failed', data: { runId, stepId: step.id, error: error.message }, timestamp: new Date() });
      throw error;
    }
  }

  /**
   * 执行技能（简化版）
   */
  private async executeSkill(skill: any, input: Record<string, any>): Promise<any> {
    // 这里应该调用 Agent 执行技能
    // 简化处理，直接返回输入
    return {
      success: true,
      skill: skill.manifest?.name || 'unknown',
      input,
      output: `Skill ${skill.manifest?.name} executed with input: ${JSON.stringify(input)}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 拓扑排序
   */
  private topologicalSort(steps: TaskStep[]): TaskStep[] {
    const result: TaskStep[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (step: TaskStep) => {
      if (visited.has(step.id)) return;
      if (visiting.has(step.id)) {
        throw new Error(`Circular dependency detected: ${step.id}`);
      }

      visiting.add(step.id);

      for (const depId of step.dependsOn) {
        const dep = steps.find(s => s.id === depId);
        if (dep) visit(dep);
      }

      visiting.delete(step.id);
      visited.add(step.id);
      result.push(step);
    };

    for (const step of steps) {
      visit(step);
    }

    // 不重新排序，保持拓扑顺序
    return result;
  }

  /**
   * 暂停工作流
   */
  pause(runId: string): void {
    const run = this.db.getWorkflowRun(runId);
    if (run && run.status === 'running') {
      this.db.updateWorkflowRun(runId, { status: 'paused' });
    }
  }

  /**
   * 恢复工作流
   */
  async resume(runId: string): Promise<void> {
    const run = this.db.getWorkflowRun(runId);
    if (run && run.status === 'paused') {
      this.db.updateWorkflowRun(runId, { status: 'running' });
      // 重新执行
      const workflow = this.getWorkflow(run.workflowId);
      if (workflow) {
        await this.executeRun(runId, workflow, run.inputs);
      }
    }
  }

  /**
   * 获取运行状态
   */
  getRun(runId: string): WorkflowRun | null {
    return this.db.getWorkflowRun(runId);
  }

  /**
   * 审批检查点
   */
  approveCheckpoint(runId: string, stepId: string): void {
    const run = this.db.getWorkflowRun(runId);
    if (!run) return;

    const step = run.steps.find((s: TaskStep) => s.id === stepId);
    if (!step || !step.checkpointResult?.requireApproval) return;

    step.checkpointResult.approved = true;
    step.checkpointResult.passed = true;
    step.status = 'passed';
    step.completedAt = new Date();

    this.db.updateWorkflowRun(runId, { steps: run.steps });
    this.emit({ type: 'checkpoint:passed', data: { runId, stepId }, timestamp: new Date() });
  }

  /**
   * 拒绝检查点
   */
  rejectCheckpoint(runId: string, stepId: string, reason: string): void {
    const run = this.db.getWorkflowRun(runId);
    if (!run) return;

    const step = run.steps.find((s: TaskStep) => s.id === stepId);
    if (!step || !step.checkpointResult?.requireApproval) return;

    step.checkpointResult.approved = false;
    step.checkpointResult.passed = false;
    step.checkpointResult.message = reason;

    // 处理拒绝
    if (step.checkpoint?.onReject?.goto) {
      const targetStep = run.steps.find((s: TaskStep) => s.id === step.checkpoint!.onReject!.goto);
      if (targetStep) {
        targetStep.status = 'pending';
        targetStep.retryCount = 0;
      }
    }

    this.db.updateWorkflowRun(runId, { steps: run.steps });
    this.emit({ type: 'checkpoint:failed', data: { runId, stepId, reason }, timestamp: new Date() });
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