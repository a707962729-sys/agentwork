/**
 * 通义千问 (Qwen) Provider 适配
 */

import { AIProvider } from '../provider';
import type { Message, ChatOptions, Tool, ToolCall } from '../types';

export interface QwenConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

/**
 * Qwen Provider 实现
 */
export class QwenProvider extends AIProvider {
  private baseURL: string;
  private model: string;

  constructor(config: QwenConfig = {}) {
    super(config);
    this.baseURL = config.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.model = config.model || 'qwen-plus';
    
    // 从环境变量读取 API Key
    if (!config.apiKey) {
      config.apiKey = this.getApiKey('DASHSCOPE_API_KEY');
    }
  }

  getName(): string {
    return 'qwen';
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    this.validateConfig();

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        messages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qwen API error: ${response.status} ${error}`);
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    return data.choices[0].message.content;
  }

  async chatWithTools(
    messages: Message[],
    tools: Tool[],
    options?: ChatOptions
  ): Promise<ToolCall> {
    this.validateConfig();

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qwen API error: ${response.status} ${error}`);
    }

    const data = await response.json() as { choices: { message: { tool_calls: { id: string; function: { name: string; arguments: string } }[] } }[] };
    const choice = data.choices[0];
    
    if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
      throw new Error('No tool call returned');
    }

    const toolCall = choice.message.tool_calls[0];
    return {
      id: toolCall.id,
      name: toolCall.function.name,
      arguments: JSON.parse(toolCall.function.arguments),
    };
  }

  async embed(text: string): Promise<number[]> {
    this.validateConfig();

    const response = await fetch(`${this.baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-v2',
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qwen API error: ${response.status} ${error}`);
    }

    const data = await response.json() as { data: { embedding: number[] }[] };
    return data.data[0].embedding;
  }
}
