/**
 * OpenAI Provider 适配
 */

import { AIProvider } from '../provider';
import type { Message, ChatOptions, Tool, ToolCall } from '../types';

export interface OpenAIConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  organization?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      tool_calls?: Array<{
        id: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  }>;
  data?: Array<{
    embedding: number[];
  }>;
}

/**
 * OpenAI Provider 实现
 */
export class OpenAIProvider extends AIProvider {
  private baseURL: string;
  private model: string;

  constructor(config: OpenAIConfig = {}) {
    super(config);
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4o';
    
    // 从环境变量读取 API Key
    if (!config.apiKey) {
      config.apiKey = this.getApiKey('OPENAI_API_KEY');
    }
  }

  getName(): string {
    return 'openai';
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    this.validateConfig();

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...(this.config.organization ? { 'OpenAI-Organization': this.config.organization } : {}),
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        messages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json() as OpenAIResponse;
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
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json() as OpenAIResponse;
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
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json() as OpenAIResponse;
    return data.data![0].embedding;
  }
}
