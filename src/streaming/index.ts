/**
 * 流式响应支持
 * SSE / WebSocket 实时输出
 */

import { Response } from 'express';

export interface StreamOptions {
  type: 'sse' | 'websocket';
  heartbeat?: number;
}

export interface StreamMessage {
  type: 'token' | 'chunk' | 'done' | 'error' | 'progress';
  content?: string;
  data?: any;
  progress?: number;
}

/**
 * SSE 流式响应封装
 */
export class SSEStream {
  private res: Response;
  private closed = false;

  constructor(res: Response) {
    this.res = res;
    this.init();
  }

  private init(): void {
    this.res.setHeader('Content-Type', 'text/event-stream');
    this.res.setHeader('Cache-Control', 'no-cache');
    this.res.setHeader('Connection', 'keep-alive');
    this.res.flushHeaders?.();
  }

  /**
   * 发送消息
   */
  send(message: StreamMessage): void {
    if (this.closed) return;
    
    const data = JSON.stringify(message);
    this.res.write(`data: ${data}\n\n`);
  }

  /**
   * 发送 token（流式输出）
   */
  token(content: string): void {
    this.send({ type: 'token', content });
  }

  /**
   * 发送进度
   */
  progress(current: number, total: number, message?: string): void {
    this.send({
      type: 'progress',
      progress: Math.round((current / total) * 100),
      data: { current, total, message }
    });
  }

  /**
   * 发送完成
   */
  done(data?: any): void {
    this.send({ type: 'done', data });
    this.close();
  }

  /**
   * 发送错误
   */
  error(error: string): void {
    this.send({ type: 'error', content: error });
    this.close();
  }

  /**
   * 关闭流
   */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.res.end();
  }
}

/**
 * 流式 AI 调用包装器
 */
export async function* streamAI(
  provider: string,
  messages: Array<{ role: string; content: string }>,
  options: { model?: string; temperature?: number } = {}
): AsyncGenerator<string> {
  // 根据 provider 选择 API
  const apiUrl = getApiUrl(provider);
  const apiKey = getApiKey(provider);
  const model = options.model || getDefaultModel(provider);

  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {}
      }
    }
  }
}

/**
 * 流式执行技能
 */
export async function executeSkillStream(
  skill: any,
  input: Record<string, any>,
  onToken: (token: string) => void
): Promise<any> {
  // 构建提示词
  const prompt = buildPrompt(skill, input);
  
  // 流式调用 AI
  let result = '';
  for await (const token of streamAI('glm', [
    { role: 'system', content: '你是一个专业的任务执行助手。' },
    { role: 'user', content: prompt }
  ])) {
    result += token;
    onToken(token);
  }

  // 解析结果
  return parseResult(result);
}

// 辅助函数
function getApiUrl(provider: string): string {
  const urls: Record<string, string> = {
    glm: process.env.ZHIPU_API_BASE || 'https://open.bigmodel.cn/api/paas/v4',
    openai: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
    deepseek: 'https://api.deepseek.com/v1'
  };
  return urls[provider] || urls.glm;
}

function getApiKey(provider: string): string {
  const keys: Record<string, string | undefined> = {
    glm: process.env.ZHIPU_API_KEY || process.env.AI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY
  };
  return keys[provider] || '';
}

function getDefaultModel(provider: string): string {
  const models: Record<string, string> = {
    glm: 'glm-5',
    openai: 'gpt-4o-mini',
    deepseek: 'deepseek-chat'
  };
  return models[provider] || models.glm;
}

function buildPrompt(skill: any, input: Record<string, any>): string {
  return `执行技能: ${skill.manifest?.name || 'unknown'}
描述: ${skill.manifest?.description || ''}

输入参数:
${JSON.stringify(input, null, 2)}

请返回 JSON 格式的结果。`;
}

function parseResult(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    // 尝试提取 JSON
    const match = content.match(/```json\n([\s\S]*?)\n```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {}
    }
    return { success: true, content };
  }
}