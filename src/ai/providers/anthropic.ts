/**
 * Anthropic (Claude) Provider 适配
 */

import { AIProvider } from '../provider';
import type { Message, ChatOptions, Tool, ToolCall } from '../types';

export interface AnthropicConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  version?: string;
}

/**
 * Anthropic Provider 实现
 */
export class AnthropicProvider extends AIProvider {
  private baseURL: string;
  private model: string;
  private version: string;

  constructor(config: AnthropicConfig = {}) {
    super(config);
    this.baseURL = config.baseURL || 'https://api.anthropic.com';
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.version = config.version || '2023-06-01';
    
    // 从环境变量读取 API Key
    if (!config.apiKey) {
      config.apiKey = this.getApiKey('ANTHROPIC_API_KEY');
    }
  }

  getName(): string {
    return 'anthropic';
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    this.validateConfig();

    // 转换消息格式为 Anthropic 格式
    const systemMessage = messages.find(m => m.role === 'system');
    const anthropicMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': this.version,
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        messages: anthropicMessages,
        system: systemMessage?.content,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature,
        top_p: options?.topP,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json() as { content: { text: string }[] };
    return data.content[0].text;
  }

  async chatWithTools(
    messages: Message[],
    tools: Tool[],
    options?: ChatOptions
  ): Promise<ToolCall> {
    this.validateConfig();

    const systemMessage = messages.find(m => m.role === 'system');
    const anthropicMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    // 转换工具格式为 Anthropic 格式
    const anthropicTools = tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': this.version,
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        messages: anthropicMessages,
        system: systemMessage?.content,
        tools: anthropicTools,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json() as { content: any[] };
    
    // 查找工具调用
    const toolUse = data.content.find((block: any) => block.type === 'tool_use');
    if (!toolUse) {
      throw new Error('No tool call returned');
    }

    return {
      id: toolUse.id,
      name: toolUse.name,
      arguments: toolUse.input,
    };
  }

  async embed(text: string): Promise<number[]> {
    // Anthropic 不直接提供嵌入 API，这里可以使用第三方服务
    // 或者抛出错误提示使用其他 provider
    throw new Error('Anthropic does not provide embedding API. Use OpenAI or other provider for embeddings.');
  }
}
