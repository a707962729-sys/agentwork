/**
 * Ollama (本地模型) Provider 适配
 */

import { AIProvider } from '../provider';
import type { Message, ChatOptions, Tool, ToolCall } from '../types';

export interface OllamaConfig {
  baseURL?: string;
  model?: string;
}

/**
 * Ollama Provider 实现
 */
export class OllamaProvider extends AIProvider {
  private baseURL: string;
  private model: string;

  constructor(config: OllamaConfig = {}) {
    super(config);
    this.baseURL = config.baseURL || 'http://localhost:11434';
    this.model = config.model || 'llama3.1';
  }

  getName(): string {
    return 'ollama';
  }

  validateConfig(): boolean {
    // Ollama 不需要 API Key
    return true;
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature,
          num_predict: options?.maxTokens,
          top_p: options?.topP,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${error}`);
    }

    const data = await response.json() as { message: { content: string } };
    return data.message.content;
  }

  async chatWithTools(
    messages: Message[],
    tools: Tool[],
    options?: ChatOptions
  ): Promise<ToolCall> {
    // Ollama 的工具调用支持有限，这里使用简化的实现
    // 可以在 prompt 中描述工具，让模型返回 JSON 格式的工具调用
    
    const toolDescriptions = tools.map(tool => 
      `${tool.function.name}: ${tool.function.description}`
    ).join('\n');

    const systemPrompt = `You have access to the following tools:
${toolDescriptions}

Respond with a JSON object in this format:
{
  "tool": "tool_name",
  "arguments": { ... }
}

If no tool is needed, respond normally.`;

    const enhancedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
    ];

    const response = await this.chat(enhancedMessages, options);
    
    // 尝试解析工具调用
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.tool && parsed.arguments) {
          return {
            id: `tool-${Date.now()}`,
            name: parsed.tool,
            arguments: parsed.arguments,
          };
        }
      }
    } catch (e) {
      // 不是 JSON 格式，返回普通回复
    }

    throw new Error('No tool call returned');
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseURL}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${error}`);
    }

    const data = await response.json() as { embedding: number[] };
    return data.embedding;
  }
}
