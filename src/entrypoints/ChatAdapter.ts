import type { TaskOrchestrator } from '../orchestrator/index.js';

export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  channel: string;
  replyTo?: string;
}

export interface ChatResponse {
  message: string;
  replyTo?: string;
}

export abstract class ChatAdapter {
  protected orchestrator: TaskOrchestrator;
  protected channelName: string;

  constructor(orchestrator: TaskOrchestrator, channelName: string) {
    this.orchestrator = orchestrator;
    this.channelName = channelName;
  }

  /**
   * 处理收到的消息
   */
  abstract handleMessage(msg: ChatMessage): Promise<ChatResponse>;

  /**
   * 发送消息
   */
  abstract sendMessage(msg: ChatResponse): Promise<void>;

  /**
   * 解析自然语言任务
   */
  protected parseTask(content: string): { title: string; type?: string; priority?: string } | null {
    // 简单的任务识别
    const taskPatterns = [
      /^帮我\s+(.+)$/i,
      /^请\s+(.+)$/i,
      /^任务[：:]\s*(.+)$/i,
      /^创建任务\s+(.+)$/i,
    ];

    for (const pattern of taskPatterns) {
      const match = content.match(pattern);
      if (match) {
        return {
          title: match[1].trim(),
          type: this.detectTaskType(match[1]),
        };
      }
    }

    return null;
  }

  /**
   * 检测任务类型
   */
  protected detectTaskType(content: string): string {
    if (/写|文章|博客|内容/i.test(content)) return 'content';
    if (/代码|开发|bug|修复/i.test(content)) return 'dev';
    if (/分析|数据|报告/i.test(content)) return 'analysis';
    return 'custom';
  }
}
