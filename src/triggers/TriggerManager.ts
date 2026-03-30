import type { TaskOrchestrator } from '../orchestrator/index.js';
import type { WorkflowDefinition } from '../types.js';
import { CronScheduler, type CronJob } from './CronScheduler.js';
import { WebhookReceiver, type WebhookConfig } from './WebhookReceiver.js';
import { Logger } from '../logging/index.js';

export interface TriggerManagerConfig {
  webhookPort?: number;
}

export class TriggerManager {
  private logger = new Logger();
  private cronScheduler: CronScheduler;
  private webhookReceiver: WebhookReceiver;

  constructor(orchestrator: TaskOrchestrator, config: TriggerManagerConfig = {}) {
    this.cronScheduler = new CronScheduler(orchestrator);
    this.webhookReceiver = new WebhookReceiver(orchestrator, config.webhookPort || 3100);
  }

  /**
   * 从工作流加载触发器
   */
  loadFromWorkflow(workflow: WorkflowDefinition): void {
    this.cronScheduler.loadFromWorkflow(workflow);
    this.webhookReceiver.loadFromWorkflow(workflow);
  }

  /**
   * 启动所有触发器
   */
  async start(): Promise<void> {
    await this.webhookReceiver.start();
    this.logger.info('[TriggerManager] All triggers started');
  }

  /**
   * 停止所有触发器
   */
  async stop(): Promise<void> {
    this.cronScheduler.stopAll();
    await this.webhookReceiver.stop();
    this.logger.info('[TriggerManager] All triggers stopped');
  }

  /**
   * 添加 cron 任务
   */
  addCronJob(job: CronJob): void {
    this.cronScheduler.addJob(job);
  }

  /**
   * 注册 webhook
   */
  registerWebhook(config: WebhookConfig): void {
    this.webhookReceiver.registerWebhook(config);
  }

  /**
   * 列出 cron 任务
   */
  listCronJobs(): CronJob[] {
    return this.cronScheduler.listJobs();
  }

  /**
   * 列出 webhook
   */
  listWebhooks(): WebhookConfig[] {
    return this.webhookReceiver.listWebhooks();
  }
}
