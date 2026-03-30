/**
 * AgentWork Executor — 主编排器
 * 任务轮询 + Agent 调度 + Server 集成入口
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import {
  Task,
  TaskInput,
  TaskOutput,
  ExecutorState,
  AgentConfig,
} from './types.js';
import { ExecutorDB, initExecutorDb, getExecutorDb } from './db.js';
import { ToolRegistry } from './tool-registry.js';
import { AgentRuntime } from './agent-runtime.js';
import { Logger } from '../logging/index.js';

// ============ ExecutorOrchestrator ============

export class ExecutorOrchestrator extends EventEmitter {
  private logger = new Logger();
  private db!: ExecutorDB;
  private tools!: ToolRegistry;
  private pollIntervalMs = 2000;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  // 每 Agent 的并发控制：agentId → 当前运行任务数
  private activeTaskCount = new Map<string, number>();

  async init(dbPath?: string): Promise<void> {
    this.db = initExecutorDb(dbPath);
    this.tools = new ToolRegistry();
    await this.tools.init();
    this.running = false;
  }

  /**
   * 启动轮询循环
   */
  start(): void {
    if (this.running) return;
    this.running = true;

    this.pollTimer = setInterval(() => {
      this.pollTasks().catch((err) => {
        this.logger.error('[ExecutorOrchestrator] poll error: ' + err.message);
      });
    }, this.pollIntervalMs);

    this.logger.info('[ExecutorOrchestrator] 已启动，轮询间隔 2s');
  }

  /**
   * 停止轮询
   */
  stop(): void {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.logger.info('[ExecutorOrchestrator] 已停止');
  }

  /**
   * 提交任务
   */
  async submitTask(agentId: string, input: TaskInput): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      agentId,
      status: 'pending',
      priority: 'normal',
      input,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.createTask(task);
    this.emit('task:submitted', { taskId: task.id, agentId });

    return task;
  }

  /**
   * 获取任务状态
   */
  getTask(taskId: string): Task | undefined {
    return this.db.getTask(taskId);
  }

  /**
   * 中止任务
   */
  stopTask(taskId: string): void {
    const task = this.db.getTask(taskId);
    if (!task) return;

    if (task.status === 'pending') {
      this.db.updateTask(taskId, { status: 'cancelled' });
      this.emit('task:cancelled', { taskId });
    } else if (task.status === 'running') {
      this.db.updateTask(taskId, { status: 'cancelled' });
      this.emit('task:cancelled', { taskId });
    }
  }

  /**
   * 获取执行统计
   */
  getStats(): ExecutorState {
    return this.db.getExecutorStats();
  }

  /**
   * 注册 Agent
   */
  registerAgent(agent: AgentConfig): void {
    const existing = this.db.getAgent(agent.id);
    if (existing) {
      this.db.updateAgent(agent.id, agent);
    } else {
      this.db.createAgent(agent);
    }
  }

  /**
   * 获取 Agent
   */
  getAgent(agentId: string): AgentConfig | undefined {
    return this.db.getAgent(agentId);
  }

  /**
   * 列表 Agent
   */
  listAgents(): AgentConfig[] {
    return this.db.listAgents();
  }

  /**
   * 轮询待执行任务
   */
  private async pollTasks(): Promise<void> {
    if (!this.running) return;

    const pendingTasks = this.db.pollPendingTasks(10);
    for (const task of pendingTasks) {
      await this.executeTask(task);
    }
  }

  /**
   * 执行单个任务
   */
  private async executeTask(task: Task): Promise<void> {
    // 并发控制：检查该 Agent 当前运行中的任务数
    const currentActive = this.activeTaskCount.get(task.agentId) ?? 0;
    const agent = this.db.getAgent(task.agentId);

    if (!agent) {
      this.logger.warn(`[ExecutorOrchestrator] Agent ${task.agentId} not found, skipping task ${task.id}`);
      this.db.updateTask(task.id, { status: 'failed', error: `Agent ${task.agentId} not found` });
      return;
    }

    if (currentActive >= (agent.concurrentLimit ?? 3)) {
      // 该 Agent 并发满了，跳过（下次轮询再试）
      return;
    }

    // 认领任务（原子更新为 running）
    this.db.updateTask(task.id, { status: 'running', startedAt: new Date().toISOString() });
    this.activeTaskCount.set(task.agentId, currentActive + 1);

    this.emit('task:started', { taskId: task.id, agentId: task.agentId });

    const runtime = this.createRuntime();

    runtime
      .execute(task, agent)
      .then((output) => {
        this.db.updateTask(task.id, {
          status: 'completed',
          output,
          completedAt: new Date().toISOString(),
        });
        this.emit('task:completed', { taskId: task.id, agentId: task.agentId, output });
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const retryCount = task.retryCount ?? 0;

        if (retryCount < (task.maxRetries ?? 3)) {
          this.db.updateTask(task.id, {
            status: 'pending',
            retryCount: retryCount + 1,
            error: errorMsg,
          });
        } else {
          this.db.updateTask(task.id, {
            status: 'failed',
            error: errorMsg,
            completedAt: new Date().toISOString(),
          });
          this.emit('task:failed', { taskId: task.id, agentId: task.agentId, error: errorMsg });
        }
      })
      .finally(() => {
        const count = this.activeTaskCount.get(task.agentId) ?? 1;
        this.activeTaskCount.set(task.agentId, Math.max(0, count - 1));
      });
  }

  /**
   * 创建运行时实例
   */
  private createRuntime(): AgentRuntime {
    return new AgentRuntime({
      db: this.db,
      tools: this.tools,
      onProgress: (tid, progress) => {
        this.db.updateTask(tid, { progress });
        this.emit('task:progress', { taskId: tid, progress });
      },
      onMessage: (tid, message) => {
        this.emit('task:message', { taskId: tid, message });
      },
    });
  }
}

// ============ 工厂函数 ============

let _orchestrator: ExecutorOrchestrator | null = null;

export function createOrchestrator(dbPath?: string): ExecutorOrchestrator {
  _orchestrator = new ExecutorOrchestrator();
  return _orchestrator;
}

export function getOrchestrator(): ExecutorOrchestrator | null {
  return _orchestrator;
}
