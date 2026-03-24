/**
 * Context Compactor - 上下文压缩器
 * 
 * 功能:
 * 1. 消息摘要：将多轮对话压缩成摘要
 * 2. 选择性保留：保留关键信息，删除冗余
 * 3. AI 辅助压缩：用模型生成摘要
 */

import type { AIProvider } from '../ai/provider.js';
import {
  ContextMessage,
  CompactionConfig,
  CompactionResult,
  CompactionStrategy,
  ContextStats,
  AICompactor,
} from './types.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 默认压缩配置
 */
export const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  strategy: 'summarize',
  threshold: 50,           // 超过 50 条消息触发压缩
  minMessages: 10,         // 压缩后保留至少 10 条
  windowSize: 20,          // 滑动窗口大小
  importanceThreshold: 0.5, // 重要性阈值
  keepSystemMessages: true, // 保留系统消息
};

/**
 * 默认摘要提示词模板
 */
const DEFAULT_SUMMARY_PROMPT = `请将以下对话历史压缩成一个简洁的摘要。

要求：
1. 保留关键决策和结论
2. 保留重要的上下文信息
3. 保留用户的具体要求和偏好
4. 忽略闲聊和重复内容
5. 摘要应该能让 AI 助手继续之前的对话

对话历史：
{{MESSAGES}}

请输出摘要：`;

/**
 * 上下文压缩器
 */
export class Compactor implements AICompactor {
  private aiProvider?: AIProvider;

  constructor(aiProvider?: AIProvider) {
    this.aiProvider = aiProvider;
  }

  /**
   * 检查是否需要压缩
   */
  shouldCompact(
    messages: ContextMessage[],
    config?: Partial<CompactionConfig>
  ): boolean {
    const cfg = { ...DEFAULT_COMPACTION_CONFIG, ...config };
    return messages.length >= (cfg.threshold || 50);
  }

  /**
   * 压缩消息
   */
  async compact(
    messages: ContextMessage[],
    config?: Partial<CompactionConfig>
  ): Promise<CompactionResult> {
    const startTime = Date.now();
    const cfg = { ...DEFAULT_COMPACTION_CONFIG, ...config };

    // 根据策略选择压缩方法
    let result: CompactionResult;

    switch (cfg.strategy) {
      case 'summarize':
        result = await this.compactBySummarize(messages, cfg);
        break;
      case 'truncate':
        result = this.compactByTruncate(messages, cfg);
        break;
      case 'selective':
        result = await this.compactBySelective(messages, cfg);
        break;
      case 'sliding-window':
        result = this.compactBySlidingWindow(messages, cfg);
        break;
      case 'importance':
        result = await this.compactByImportance(messages, cfg);
        break;
      default:
        result = this.compactByTruncate(messages, cfg);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * 获取上下文统计
   */
  getStats(messages: ContextMessage[]): ContextStats {
    const stats: ContextStats = {
      totalMessages: messages.length,
      estimatedTokens: 0,
      byRole: {},
      avgMessageLength: 0,
      systemMessageCount: 0,
      compactedCount: 0,
    };

    let totalLength = 0;
    let oldestTime: Date | undefined;
    let newestTime: Date | undefined;

    for (const msg of messages) {
      // 按角色统计
      stats.byRole[msg.role] = (stats.byRole[msg.role] || 0) + 1;

      // 计算长度
      const length = msg.content.length;
      totalLength += length;

      // 估算 token (粗略: 1 token ≈ 4 字符)
      stats.estimatedTokens += Math.ceil(length / 4);

      // 系统消息
      if (msg.role === 'system') {
        stats.systemMessageCount++;
      }

      // 压缩消息
      if (msg.compacted) {
        stats.compactedCount++;
      }

      // 时间范围
      if (msg.timestamp) {
        if (!oldestTime || msg.timestamp < oldestTime) {
          oldestTime = msg.timestamp;
        }
        if (!newestTime || msg.timestamp > newestTime) {
          newestTime = msg.timestamp;
        }
      }
    }

    stats.avgMessageLength = messages.length > 0
      ? Math.round(totalLength / messages.length)
      : 0;
    stats.oldestMessageTime = oldestTime;
    stats.newestMessageTime = newestTime;

    return stats;
  }

  // ==================== 私有方法 ====================

  /**
   * 策略: AI 摘要压缩
   */
  private async compactBySummarize(
    messages: ContextMessage[],
    config: CompactionConfig
  ): Promise<CompactionResult> {
    const minMessages = config.minMessages || 10;

    // 如果没有 AI Provider，降级到截断
    if (!this.aiProvider) {
      return this.compactByTruncate(messages, config);
    }

    // 保留最近的 N 条消息
    const recentMessages = messages.slice(-minMessages);
    const toSummarize = messages.slice(0, -minMessages);

    if (toSummarize.length === 0) {
      return {
        messages,
        removedCount: 0,
        duration: 0,
      };
    }

    // 生成摘要
    const summary = await this.summarize(toSummarize, config.summaryPrompt);

    // 创建摘要消息
    const summaryMessage: ContextMessage = {
      id: uuidv4(),
      role: 'system',
      content: `[对话历史摘要]\n${summary}`,
      timestamp: new Date(),
      compacted: true,
      originalIds: toSummarize.map(m => m.id).filter(Boolean) as string[],
      tags: ['compacted', 'summary'],
    };

    return {
      messages: [summaryMessage, ...recentMessages],
      removedCount: toSummarize.length,
      summary,
      duration: 0,
    };
  }

  /**
   * 策略: 截断压缩
   */
  private compactByTruncate(
    messages: ContextMessage[],
    config: CompactionConfig
  ): CompactionResult {
    const minMessages = config.minMessages || 10;
    const keepSystem = config.keepSystemMessages ?? true;

    // 分离系统消息和普通消息
    const systemMessages = keepSystem
      ? messages.filter(m => m.role === 'system')
      : [];

    const nonSystemMessages = keepSystem
      ? messages.filter(m => m.role !== 'system')
      : messages;

    // 保留最近的 N 条
    const recentMessages = nonSystemMessages.slice(-minMessages);
    const removedCount = nonSystemMessages.length - recentMessages.length;

    return {
      messages: [...systemMessages, ...recentMessages],
      removedCount,
      duration: 0,
    };
  }

  /**
   * 策略: 选择性保留
   */
  private async compactBySelective(
    messages: ContextMessage[],
    config: CompactionConfig
  ): Promise<CompactionResult> {
    const minMessages = config.minMessages || 10;

    // 如果有 AI Provider，使用 AI 评估重要性
    if (this.aiProvider) {
      const scored = await Promise.all(
        messages.map(async (msg) => ({
          message: msg,
          importance: await this.evaluateImportance(msg, messages),
        }))
      );

      // 按重要性排序
      scored.sort((a, b) => b.importance - a.importance);

      // 保留高重要性消息 + 最近消息
      const threshold = config.importanceThreshold || 0.5;
      const important = scored
        .filter(s => s.importance >= threshold)
        .map(s => s.message);

      // 确保保留最近消息
      const recent = messages.slice(-Math.floor(minMessages / 2));
      const allKept = new Map<string, ContextMessage>();

      for (const msg of [...important, ...recent]) {
        if (msg.id) {
          allKept.set(msg.id, msg);
        } else {
          allKept.set(uuidv4(), msg);
        }
      }

      const kept = Array.from(allKept.values());
      return {
        messages: kept,
        removedCount: messages.length - kept.length,
        duration: 0,
      };
    }

    // 无 AI Provider，使用启发式规则
    return this.compactByHeuristics(messages, config);
  }

  /**
   * 策略: 滑动窗口
   */
  private compactBySlidingWindow(
    messages: ContextMessage[],
    config: CompactionConfig
  ): CompactionResult {
    const windowSize = config.windowSize || 20;
    const keepSystem = config.keepSystemMessages ?? true;

    // 保留系统消息
    const systemMessages = keepSystem
      ? messages.filter(m => m.role === 'system')
      : [];

    // 滑动窗口
    const recentMessages = messages
      .filter(m => !keepSystem || m.role !== 'system')
      .slice(-windowSize);

    return {
      messages: [...systemMessages, ...recentMessages],
      removedCount: messages.length - systemMessages.length - recentMessages.length,
      duration: 0,
    };
  }

  /**
   * 策略: 按重要性过滤
   */
  private async compactByImportance(
    messages: ContextMessage[],
    config: CompactionConfig
  ): Promise<CompactionResult> {
    // 如果有 AI Provider，使用 AI 评估
    if (this.aiProvider) {
      return this.compactBySelective(messages, config);
    }

    // 否则使用启发式重要性评估
    return this.compactByHeuristics(messages, config);
  }

  /**
   * 启发式压缩 (无 AI)
   */
  private compactByHeuristics(
    messages: ContextMessage[],
    config: CompactionConfig
  ): CompactionResult {
    const minMessages = config.minMessages || 10;
    const keepSystem = config.keepSystemMessages ?? true;

    // 计算启发式重要性分数
    const scored = messages.map(msg => ({
      message: msg,
      importance: this.calculateHeuristicImportance(msg),
    }));

    // 排序
    scored.sort((a, b) => b.importance - a.importance);

    // 保留高重要性 + 最近消息
    const recent = messages.slice(-minMessages);
    const recentIds = new Set(recent.map(m => m.id).filter(Boolean));

    const kept = scored
      .filter(s => s.message.role === 'system' && keepSystem || recentIds.has(s.message.id))
      .map(s => s.message);

    return {
      messages: kept,
      removedCount: messages.length - kept.length,
      duration: 0,
    };
  }

  /**
   * 计算启发式重要性分数
   */
  private calculateHeuristicImportance(message: ContextMessage): number {
    let score = 0.5;

    // 系统消息高重要性
    if (message.role === 'system') {
      score += 0.4;
    }

    // 用户消息稍高
    if (message.role === 'user') {
      score += 0.1;
    }

    // 包含关键词
    const importantKeywords = ['重要', '关键', '决定', '结论', '要求', '必须', 'important', 'key', 'decision'];
    const content = message.content.toLowerCase();
    for (const keyword of importantKeywords) {
      if (content.includes(keyword)) {
        score += 0.1;
        break;
      }
    }

    // 已有重要性分数
    if (message.importance !== undefined) {
      score = message.importance;
    }

    return Math.min(1, Math.max(0, score));
  }

  // ==================== AI 辅助压缩接口 ====================

  /**
   * AI 生成摘要
   */
  async summarize(
    messages: ContextMessage[],
    prompt?: string
  ): Promise<string> {
    if (!this.aiProvider) {
      // 无 AI Provider，生成简单摘要
      return this.generateSimpleSummary(messages);
    }

    const messagesText = messages
      .map(m => `[${m.role}]: ${m.content}`)
      .join('\n\n');

    const promptTemplate = prompt || DEFAULT_SUMMARY_PROMPT;
    const fullPrompt = promptTemplate.replace('{{MESSAGES}}', messagesText);

    const result = await this.aiProvider.chat([
      { role: 'user', content: fullPrompt }
    ]);

    return result;
  }

  /**
   * 提取关键信息
   */
  async extractKeyInfo(messages: ContextMessage[]): Promise<string[]> {
    if (!this.aiProvider) {
      // 无 AI Provider，使用关键词提取
      return this.extractKeywords(messages);
    }

    const messagesText = messages
      .map(m => `[${m.role}]: ${m.content}`)
      .join('\n\n');

    const prompt = `请从以下对话中提取关键信息点，每行一个：

${messagesText}

关键信息：`;

    const result = await this.aiProvider.chat([
      { role: 'user', content: prompt }
    ]);

    return result.split('\n').filter(line => line.trim());
  }

  /**
   * 评估消息重要性
   */
  async evaluateImportance(
    message: ContextMessage,
    context: ContextMessage[]
  ): Promise<number> {
    if (!this.aiProvider) {
      return this.calculateHeuristicImportance(message);
    }

    const contextSummary = context
      .slice(-10)
      .map(m => `[${m.role}]: ${m.content.slice(0, 100)}...`)
      .join('\n');

    const prompt = `评估以下消息在对话中的重要性 (0-1分)：

对话上下文：
${contextSummary}

待评估消息：
[${message.role}]: ${message.content}

重要性分数 (只输出数字)：`;

    const result = await this.aiProvider.chat([
      { role: 'user', content: prompt }
    ]);

    const score = parseFloat(result.trim());
    return isNaN(score) ? 0.5 : Math.min(1, Math.max(0, score));
  }

  // ==================== 辅助方法 ====================

  /**
   * 生成简单摘要 (无 AI)
   */
  private generateSimpleSummary(messages: ContextMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    return `对话包含 ${messages.length} 条消息：
- 用户消息: ${userMessages.length} 条
- 助手消息: ${assistantMessages.length} 条
- 时间跨度: ${this.getTimeSpan(messages)}`;
  }

  /**
   * 提取关键词 (无 AI)
   */
  private extractKeywords(messages: ContextMessage[]): string[] {
    const keywords: Set<string> = new Set();
    const stopWords = new Set(['的', '了', '是', '在', '和', '有', '我', '你', '他', '她']);

    for (const msg of messages) {
      const words = msg.content.split(/\s+/);
      for (const word of words) {
        if (word.length > 1 && !stopWords.has(word)) {
          keywords.add(word);
        }
      }
    }

    return Array.from(keywords).slice(0, 20);
  }

  /**
   * 获取时间跨度
   */
  private getTimeSpan(messages: ContextMessage[]): string {
    const timestamps = messages
      .filter(m => m.timestamp)
      .map(m => m.timestamp!.getTime());

    if (timestamps.length < 2) {
      return '未知';
    }

    const span = Math.max(...timestamps) - Math.min(...timestamps);
    const minutes = Math.floor(span / 60000);

    if (minutes < 60) {
      return `${minutes} 分钟`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} 小时`;
    }

    const days = Math.floor(hours / 24);
    return `${days} 天`;
  }
}

/**
 * 创建压缩器实例
 */
export function createCompactor(aiProvider?: AIProvider): Compactor {
  return new Compactor(aiProvider);
}