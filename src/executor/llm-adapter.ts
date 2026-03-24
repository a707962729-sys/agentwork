/**
 * AgentWork Executor — LLM 适配器
 * 支持 OpenAI / Anthropic / OpenAI 兼容端点
 */

import { LLMMessage, LLMResponse, LLMUsage, ToolDefinition } from './types.js';

// ============ 配置 ============

export interface LLMConfig {
  model: string;
  modelType: 'openai' | 'anthropic' | 'openai-compatible';
  apiKey: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

// ============ 错误类 ============

export class LLMError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// ============ LLM Adapter ============

export class LLMAdapter {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      maxTokens: 4096,
      temperature: 0.7,
      ...config,
    };
  }

  /**
   * 核心聊天接口
   */
  async chat(
    messages: LLMMessage[],
    tools?: ToolDefinition[]
  ): Promise<LLMResponse> {
    switch (this.config.modelType) {
      case 'openai':
        return this.chatOpenAI(messages, tools);
      case 'anthropic':
        return this.chatAnthropic(messages, tools);
      case 'openai-compatible':
        return this.chatOpenAICompatible(messages, tools);
      default:
        return this.chatOpenAI(messages, tools);
    }
  }

  /**
   * OpenAI GPT 系列
   */
  private async chatOpenAI(
    messages: LLMMessage[],
    tools?: ToolDefinition[]
  ): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl?.replace(/\/$/, '') ?? 'https://api.openai.com';

    const body: Record<string, any> = {
      model: this.config.model,
      messages: this.formatMessages(messages),
      max_tokens: this.config.maxTokens ?? 4096,
      temperature: this.config.temperature ?? 0.7,
    };

    if (tools?.length) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
      body.tool_choice = 'auto';
    }

    return this.request(
      `${baseUrl}/v1/chat/completions`,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body
    );
  }

  /**
   * Anthropic Claude 系列
   */
  private async chatAnthropic(
    messages: LLMMessage[],
    tools?: ToolDefinition[]
  ): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl?.replace(/\/$/, '') ?? 'https://api.anthropic.com';

    // 系统消息单独提取
    const systemMsgs = messages.filter((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const body: Record<string, any> = {
      model: this.config.model,
      messages: chatMessages.map((m) => {
        if (m.role === 'tool') {
          return {
            role: 'user' as const,
            content: [
              {
                type: 'tool_result' as const,
                tool_use_id: m.toolCallId,
                content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
              },
            ],
          };
        }
        return {
          role: m.role === 'assistant' ? ('assistant' as const) : m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          ...(m.name ? { name: m.name } : {}),
        };
      }),
      max_tokens: this.config.maxTokens ?? 4096,
      temperature: this.config.temperature ?? 0.7,
    };

    if (systemMsgs.length) {
      body.system = systemMsgs.map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content))).join('\n');
    }

    if (tools?.length) {
      body.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters ?? { type: 'object', properties: {} },
      }));
    }

    return this.requestAnthropic(`${baseUrl}/v1/messages`, body);
  }

  /**
   * OpenAI 兼容端点（国产模型：GLM、Qwen、MoonShot 等）
   * 大部分国产模型使用 OpenAI 兼容格式
   */
  private async chatOpenAICompatible(
    messages: LLMMessage[],
    tools?: ToolDefinition[]
  ): Promise<LLMResponse> {
    // 优先使用 baseUrl，否则默认 OpenAI
    const baseUrl = this.config.baseUrl?.replace(/\/$/, '') ?? 'https://api.openai.com';

    const body: Record<string, any> = {
      model: this.config.model,
      messages: this.formatMessages(messages),
      max_tokens: this.config.maxTokens ?? 4096,
      temperature: this.config.temperature ?? 0.7,
    };

    if (tools?.length) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
      body.tool_choice = 'auto';
    }

    return this.request(
      `${baseUrl}/v1/chat/completions`,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body
    );
  }

  /**
   * 流式聊天（ReadableStream）
   */
  async *streamChat(
    messages: LLMMessage[],
    tools?: ToolDefinition[]
  ): AsyncGenerator<string, void, unknown> {
    const baseUrl = this.config.baseUrl?.replace(/\/$/, '') ?? 'https://api.openai.com';

    const body: Record<string, any> = {
      model: this.config.model,
      messages: this.formatMessages(messages),
      max_tokens: this.config.maxTokens ?? 4096,
      temperature: this.config.temperature ?? 0.7,
      stream: true,
    };

    if (tools?.length) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
      body.tool_choice = 'auto';
    }

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new LLMError(`OpenAI Stream Error: ${response.status} - ${error}`, response.status);
    }

    if (!response.body) throw new LLMError('Response body is null', 500);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]' || trimmed === '[DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) yield delta;
            } catch {
              // skip malformed
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ============ 内部方法 ============

  private formatMessages(messages: LLMMessage[]): object[] {
    return messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool' as const,
          tool_call_id: m.toolCallId,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        };
      }
      const obj: Record<string, any> = {
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      };
      if (m.name) obj.name = m.name;
      if (m.toolCalls) {
        obj.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: tc.type,
          function: tc.function,
        }));
      }
      return obj;
    });
  }

  private async request(
    url: string,
    headers: Record<string, string>,
    body: Record<string, any>
  ): Promise<LLMResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const retryable = response.status >= 500 || response.status === 429;
      throw new LLMError(
        `${this.config.modelType.toUpperCase()} API Error: ${response.status} - ${errorText}`,
        response.status,
        retryable
      );
    }

    return response.json() as Promise<LLMResponse>;
  }

  private async requestAnthropic(
    url: string,
    body: Record<string, any>
  ): Promise<LLMResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new LLMError(
        `Anthropic API Error: ${response.status} - ${errorText}`,
        response.status,
        response.status >= 500 || response.status === 429
      );
    }

    const data = await response.json();
    return this.convertAnthropicResponse(data);
  }

  private convertAnthropicResponse(data: any): LLMResponse {
    const toolCalls =
      data.content
        ?.filter((c: any) => c.type === 'tool_use')
        .map((c: any) => ({
          id: c.id,
          type: 'function' as const,
          function: {
            name: c.name,
            arguments: JSON.stringify(c.input ?? {}),
          },
        })) ?? [];

    const textContent = data.content?.find((c: any) => c.type === 'text')?.text ?? null;

    return {
      id: data.id ?? `anthropic-${Date.now()}`,
      model: data.model,
      choices: [
        {
          message: {
            role: 'assistant' as const,
            content: textContent,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          },
          finishReason: data.stop_reason ?? (toolCalls.length > 0 ? 'tool_calls' : 'stop'),
        },
      ],
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens ?? 0,
            completionTokens: data.usage.output_tokens ?? 0,
            totalTokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
          }
        : undefined,
    };
  }
}
