/**
 * 工具注册与管理
 * 参考 OpenAI Function Calling 格式
 */

import { Logger } from '../logging/index.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  required?: string[];
}

export interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    enum?: any[];
    default?: any;
  }>;
}

export type ToolHandler<T = any, R = any> = (params: T, context: ToolContext) => Promise<R> | R;

export interface ToolContext {
  logger: Logger;
  timeout?: number;
  userId?: string;
  sessionId?: string;
}

export interface ToolResult<R = any> {
  success: boolean;
  result?: R;
  error?: string;
  duration: number;
}

/**
 * 工具注册表
 */
export class ToolRegistry {
  private tools: Map<string, {
    definition: ToolDefinition;
    handler: ToolHandler;
  }> = new Map();
  private logger = new Logger();

  /**
   * 注册工具
   */
  register<T = any, R = any>(
    definition: ToolDefinition,
    handler: ToolHandler<T, R>
  ): void {
    if (this.tools.has(definition.name)) {
      this.logger.warn(`Tool ${definition.name} already registered, overwriting`);
    }
    
    this.tools.set(definition.name, {
      definition,
      handler: handler as ToolHandler
    });
    
    this.logger.debug(`Registered tool: ${definition.name}`);
  }

  /**
   * 批量注册工具
   */
  registerAll(tools: Array<{
    definition: ToolDefinition;
    handler: ToolHandler;
  }>): void {
    for (const { definition, handler } of tools) {
      this.register(definition, handler);
    }
  }

  /**
   * 执行工具
   */
  async execute<T = any, R = any>(
    name: string,
    params: T,
    context: Partial<ToolContext> = {}
  ): Promise<ToolResult<R>> {
    const ctx: ToolContext = {
      logger: this.logger,
      ...context
    };
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${name}`,
        duration: 0
      };
    }

    const start = Date.now();
    
    try {
      // 验证参数
      this.validateParams(tool.definition, params);
      
      // 执行
      const result = await Promise.race([
        tool.handler(params, ctx),
        this.timeout(ctx.timeout || 30000)
      ]);
      
      return {
        success: true,
        result,
        duration: Date.now() - start
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - start
      };
    }
  }

  /**
   * 获取工具定义
   */
  getDefinition(name: string): ToolDefinition | undefined {
    return this.tools.get(name)?.definition;
  }

  /**
   * 获取所有工具定义（用于 AI function calling）
   */
  getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  /**
   * 获取 OpenAI 格式的工具定义
   */
  getOpenAITools(): Array<{
    type: 'function';
    function: ToolDefinition;
  }> {
    return this.getAllDefinitions().map(def => ({
      type: 'function' as const,
      function: def
    }));
  }

  /**
   * 列出所有工具
   */
  list(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 检查工具是否存在
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 移除工具
   */
  remove(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * 验证参数
   */
  private validateParams(definition: ToolDefinition, params: any): void {
    const required = definition.required || [];
    
    for (const key of required) {
      if (params[key] === undefined) {
        throw new Error(`Missing required parameter: ${key}`);
      }
    }
    
    // 类型验证
    const props = definition.parameters.properties;
    for (const [key, value] of Object.entries(params)) {
      const prop = props[key];
      if (!prop) continue;
      
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== prop.type && prop.type !== 'object') {
        throw new Error(`Parameter ${key} must be ${prop.type}, got ${actualType}`);
      }
      
      // 枚举验证
      if (prop.enum && !prop.enum.includes(value)) {
        throw new Error(`Parameter ${key} must be one of: ${prop.enum.join(', ')}`);
      }
    }
  }

  /**
   * 超时处理
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Tool execution timed out after ${ms}ms`)), ms);
    });
  }
}

// 全局工具注册表
export const toolRegistry = new ToolRegistry();

// 内置工具定义
export const builtInTools: Array<{
  definition: ToolDefinition;
  handler: ToolHandler;
}> = [
  {
    definition: {
      name: 'web_search',
      description: '搜索互联网获取信息',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          limit: { type: 'number', description: '结果数量', default: 5 }
        }
      },
      required: ['query']
    },
    handler: async (params: { query: string; limit?: number }) => {
      // 实际实现调用搜索服务
      return { query: params.query, results: [], note: 'Use web_search tool' };
    }
  },
  {
    definition: {
      name: 'read_file',
      description: '读取文件内容',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' }
        }
      },
      required: ['path']
    },
    handler: async (params: { path: string }, context: ToolContext) => {
      const fs = await import('fs/promises');
      return fs.readFile(params.path, 'utf-8');
    }
  },
  {
    definition: {
      name: 'write_file',
      description: '写入文件内容',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          content: { type: 'string', description: '文件内容' }
        }
      },
      required: ['path', 'content']
    },
    handler: async (params: { path: string; content: string }) => {
      const fs = await import('fs/promises');
      await fs.writeFile(params.path, params.content, 'utf-8');
      return { success: true, path: params.path };
    }
  }
];