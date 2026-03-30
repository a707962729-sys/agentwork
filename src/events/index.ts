/**
 * 事件总线
 * 发布-订阅模式，支持异步事件处理
 */

import { Logger } from '../logging/index.js';

export type EventHandler<T = any> = (event: T) => void | Promise<void>;

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  once: boolean;
}

export interface EventMetrics {
  published: number;
  handled: number;
  errors: number;
  listeners: number;
}

/**
 * 类型安全的事件总线
 */
export class EventBus {
  private logger = new Logger();
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private metrics: EventMetrics = {
    published: 0,
    handled: 0,
    errors: 0,
    listeners: 0
  };
  private middleware: Array<(event: any, next: () => Promise<void>) => Promise<void>> = [];

  /**
   * 订阅事件
   */
  on<T>(eventType: string, handler: EventHandler<T>): () => void {
    const id = this.generateId();
    const subscription: EventSubscription = {
      id,
      eventType,
      handler: handler as EventHandler,
      once: false
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType)!.push(subscription);
    this.metrics.listeners++;

    // 返回取消订阅函数
    return () => this.off(eventType, id);
  }

  /**
   * 订阅一次
   */
  once<T>(eventType: string, handler: EventHandler<T>): () => void {
    const id = this.generateId();
    const subscription: EventSubscription = {
      id,
      eventType,
      handler: handler as EventHandler,
      once: true
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType)!.push(subscription);
    this.metrics.listeners++;

    return () => this.off(eventType, id);
  }

  /**
   * 取消订阅
   */
  private off(eventType: string, id: string): void {
    const subs = this.subscriptions.get(eventType);
    if (!subs) return;

    const index = subs.findIndex(s => s.id === id);
    if (index >= 0) {
      subs.splice(index, 1);
      this.metrics.listeners--;
    }
  }

  /**
   * 发布事件
   */
  async emit<T>(eventType: string, event: T): Promise<void> {
    this.metrics.published++;

    // 执行中间件
    await this.executeMiddleware(event, async () => {
      await this.executeHandlers(eventType, event);
    });
  }

  /**
   * 同步发布（不等待处理完成）
   */
  emitSync<T>(eventType: string, event: T): void {
    this.metrics.published++;
    
    // 异步执行，不等待
    this.executeHandlers(eventType, event).catch(error => {
      this.metrics.errors++;
      this.logger.error(`Event handler error for ${eventType}: ${error instanceof Error ? error.message : error}`);
    });
  }

  /**
   * 执行处理器
   */
  private async executeHandlers<T>(eventType: string, event: T): Promise<void> {
    const subs = this.subscriptions.get(eventType);
    if (!subs || subs.length === 0) return;

    const toRemove: string[] = [];

    for (const sub of subs) {
      try {
        await sub.handler(event);
        this.metrics.handled++;

        if (sub.once) {
          toRemove.push(sub.id);
        }
      } catch (error) {
        this.metrics.errors++;
        this.logger.error(`Event handler error for ${eventType}: ${error instanceof Error ? error.message : error}`);
      }
    }

    // 移除一次性订阅
    for (const id of toRemove) {
      this.off(eventType, id);
    }
  }

  /**
   * 添加中间件
   */
  use(middleware: (event: any, next: () => Promise<void>) => Promise<void>): void {
    this.middleware.push(middleware);
  }

  /**
   * 执行中间件链
   */
  private async executeMiddleware(event: any, final: () => Promise<void>): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.middleware.length) {
        return final();
      }
      const middleware = this.middleware[index++];
      await middleware(event, next);
    };

    await next();
  }

  /**
   * 获取指标
   */
  getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  /**
   * 清除所有订阅
   */
  clear(): void {
    this.subscriptions.clear();
    this.metrics.listeners = 0;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Math.random().toString(36).slice(2, 11);
  }
}

// 预定义事件类型
export const EventTypes = {
  // 任务事件
  TASK_CREATED: 'task:created',
  TASK_STARTED: 'task:started',
  TASK_COMPLETED: 'task:completed',
  TASK_FAILED: 'task:failed',
  
  // 步骤事件
  STEP_STARTED: 'step:started',
  STEP_COMPLETED: 'step:completed',
  STEP_FAILED: 'step:failed',
  
  // 技能事件
  SKILL_EXECUTED: 'skill:executed',
  SKILL_ERROR: 'skill:error',
  
  // AI 事件
  AI_CALL_STARTED: 'ai:call:started',
  AI_CALL_COMPLETED: 'ai:call:completed',
  AI_CALL_ERROR: 'ai:call:error',
  
  // 工作流事件
  WORKFLOW_STARTED: 'workflow:started',
  WORKFLOW_COMPLETED: 'workflow:completed',
  WORKFLOW_PAUSED: 'workflow:paused',
  
  // 系统事件
  SYSTEM_ERROR: 'system:error',
  SYSTEM_WARNING: 'system:warning'
} as const;

// 全局事件总线
export const eventBus = new EventBus();