import type { Event } from '../types.js';

export interface NotificationChannel {
  name: string;
  send(message: string): Promise<void>;
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  enabledEvents: string[];
}

export class NotificationManager {
  private channels: Map<string, NotificationChannel> = new Map();
  private enabledEvents: Set<string>;

  constructor(config: NotificationConfig = { channels: [], enabledEvents: [] }) {
    this.enabledEvents = new Set(config.enabledEvents);
    config.channels.forEach(ch => this.channels.set(ch.name, ch));
  }

  /**
   * 注册通知渠道
   */
  registerChannel(channel: NotificationChannel): void {
    this.channels.set(channel.name, channel);
  }

  /**
   * 发送通知到所有渠道
   */
  async notify(message: string, channels?: string[]): Promise<void> {
    const targetChannels = channels 
      ? channels.map(name => this.channels.get(name)).filter(Boolean)
      : Array.from(this.channels.values());

    await Promise.allSettled(
      targetChannels.map(ch => ch!.send(message))
    );
  }

  /**
   * 处理事件通知
   */
  async handleEvent(event: Event): Promise<void> {
    if (!this.enabledEvents.has(event.type)) return;

    const message = this.formatEventMessage(event);
    await this.notify(message);
  }

  /**
   * 格式化事件消息
   */
  private formatEventMessage(event: Event): string {
    const templates: Record<string, (data: any) => string> = {
      'task:created': (d) => `📋 新任务: ${d.task?.title || 'Unknown'}`,
      'task:completed': (d) => `✅ 任务完成: ${d.taskId}`,
      'task:failed': (d) => `❌ 任务失败: ${d.taskId} - ${d.error || ''}`,
      'step:completed': (d) => `✓ 步骤完成: ${d.stepId}`,
      'step:failed': (d) => `✗ 步骤失败: ${d.stepId} - ${d.error || ''}`,
    };

    const formatter = templates[event.type] || ((_d: any) => `Event: ${event.type}`);
    return formatter(event.data);
  }

  /**
   * 启用事件通知
   */
  enableEvent(eventType: string): void {
    this.enabledEvents.add(eventType);
  }

  /**
   * 禁用事件通知
   */
  disableEvent(eventType: string): void {
    this.enabledEvents.delete(eventType);
  }
}
