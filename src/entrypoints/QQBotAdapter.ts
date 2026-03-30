import { ChatAdapter, type ChatMessage, type ChatResponse } from './ChatAdapter.js';
import type { TaskOrchestrator } from '../orchestrator/index.js';
import { Logger } from '../logging/index.js';

export class QQBotAdapter extends ChatAdapter {
  private logger = new Logger();

  constructor(orchestrator: TaskOrchestrator) {
    super(orchestrator, 'qqbot');
  }

  async handleMessage(msg: ChatMessage): Promise<ChatResponse> {
    const taskInfo = this.parseTask(msg.content);
    
    if (taskInfo) {
      try {
        const task = await this.orchestrator.createTask({
          title: taskInfo.title,
          type: taskInfo.type as any,
          priority: taskInfo.priority as any || 'normal',
        });

        // 加入队列执行
        this.orchestrator.enqueue(task.id);
        
        return {
          message: `✅ 任务已创建: ${taskInfo.title}\n任务ID: ${task.id}`,
          replyTo: msg.id,
        };
      } catch (error: any) {
        return {
          message: `❌ 创建任务失败: ${error.message}`,
          replyTo: msg.id,
        };
      }
    }

    // 非任务消息，简单响应
    return {
      message: '收到消息。发送"任务：xxx"来创建任务。',
      replyTo: msg.id,
    };
  }

  async sendMessage(msg: ChatResponse): Promise<void> {
    // 这里应该调用 QQ 消息发送 API
    // 在 OpenClaw 环境中会通过 message 工具发送
    this.logger.debug(`[QQBot] ${msg.message}`);
  }
}
