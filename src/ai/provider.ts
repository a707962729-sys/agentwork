/**
 * AI Provider 抽象基类
 */

import type { Message, ChatOptions, Tool, ToolCall } from './types';

/**
 * AI Provider 抽象类
 * 所有 AI 提供商必须实现此接口
 */
export abstract class AIProvider {
  protected config: any;

  constructor(config: any = {}) {
    this.config = config;
  }

  /**
   * 普通对话
   * @param messages 消息历史
   * @param options 对话选项
   * @returns AI 回复内容
   */
  abstract chat(messages: Message[], options?: ChatOptions): Promise<string>;

  /**
   * 带工具调用的对话
   * @param messages 消息历史
   * @param tools 可用工具列表
   * @param options 对话选项
   * @returns 工具调用信息
   */
  abstract chatWithTools(
    messages: Message[],
    tools: Tool[],
    options?: ChatOptions
  ): Promise<ToolCall>;

  /**
   * 获取文本嵌入向量
   * @param text 输入文本
   * @returns 嵌入向量
   */
  abstract embed(text: string): Promise<number[]>;

  /**
   * 获取提供商名称
   */
  abstract getName(): string;

  /**
   * 验证配置是否有效
   */
  validateConfig(): boolean {
    if (!this.config.apiKey) {
      throw new Error(`${this.getName()} API Key is required`);
    }
    return true;
  }

  /**
   * 从环境变量读取配置
   */
  protected getApiKey(envVar: string): string {
    const key = process.env[envVar];
    if (!key) {
      throw new Error(`Environment variable ${envVar} is not set`);
    }
    return key;
  }
}
