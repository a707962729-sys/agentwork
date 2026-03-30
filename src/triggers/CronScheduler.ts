import type { TaskOrchestrator } from '../orchestrator/index.js';
import type { WorkflowDefinition } from '../types.js';
import { Logger } from '../logging/index.js';

export interface CronJob {
  id: string;
  workflowId: string;
  cron: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class CronScheduler {
  private logger = new Logger();
  private orchestrator: TaskOrchestrator;
  private jobs: Map<string, CronJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(orchestrator: TaskOrchestrator) {
    this.orchestrator = orchestrator;
  }

  /**
   * 解析 cron 表达式（简化版，支持基本格式）
   * 格式: "分 时 日 月 周"
   */
  parseCron(expression: string): { minute: number; hour: number } | null {
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 2) return null;

    const minute = parts[0] === '*' ? -1 : parseInt(parts[0]);
    const hour = parts[1] === '*' ? -1 : parseInt(parts[1]);

    return { minute, hour };
  }

  /**
   * 添加定时任务
   */
  addJob(job: CronJob): void {
    this.jobs.set(job.id, job);
    if (job.enabled) {
      this.scheduleJob(job);
    }
  }

  /**
   * 调度任务
   */
  private scheduleJob(job: CronJob): void {
    const parsed = this.parseCron(job.cron);
    if (!parsed) return;

    // 计算下次执行时间
    const now = new Date();
    let nextRun = new Date();
    
    if (parsed.minute >= 0 && parsed.hour >= 0) {
      nextRun.setHours(parsed.hour, parsed.minute, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    }

    job.nextRun = nextRun;

    // 计算延迟时间（毫秒）
    const delay = nextRun.getTime() - now.getTime();
    
    // 设置定时器
    const timeout = setTimeout(() => {
      this.executeJob(job.id);
    }, delay);

    this.intervals.set(job.id, timeout);
  }

  /**
   * 执行任务
   */
  private async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || !job.enabled) return;

    this.logger.debug(`[CronScheduler] Executing job ${jobId} - ${job.workflowId}`);

    try {
      // 创建任务并执行
      const task = await this.orchestrator.createTask({
        title: `Scheduled: ${job.workflowId}`,
        type: 'custom',
        workflowId: job.workflowId,
      });

      this.orchestrator.enqueue(task.id);
      job.lastRun = new Date();
    } catch (error) {
      this.logger.error(`[CronScheduler] Job ${jobId} failed: ${error instanceof Error ? error.message : error}`);
    }

    // 重新调度下一次执行
    if (job.enabled) {
      this.scheduleJob(job);
    }
  }

  /**
   * 暂停任务
   */
  pauseJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = false;
      const timeout = this.intervals.get(jobId);
      if (timeout) {
        clearTimeout(timeout);
        this.intervals.delete(jobId);
      }
    }
  }

  /**
   * 恢复任务
   */
  resumeJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = true;
      this.scheduleJob(job);
    }
  }

  /**
   * 删除任务
   */
  removeJob(jobId: string): void {
    this.pauseJob(jobId);
    this.jobs.delete(jobId);
  }

  /**
   * 列出所有任务
   */
  listJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * 从工作流定义加载触发器
   */
  loadFromWorkflow(workflow: WorkflowDefinition): void {
    if (!workflow.triggers) return;

    for (const trigger of workflow.triggers) {
      if (trigger.type === 'schedule' && trigger.cron) {
        this.addJob({
          id: `${workflow.metadata.id}-cron`,
          workflowId: workflow.metadata.id,
          cron: trigger.cron,
          enabled: true,
        });
      }
    }
  }

  /**
   * 停止所有任务
   */
  stopAll(): void {
    for (const jobId of this.jobs.keys()) {
      this.pauseJob(jobId);
    }
  }
}
