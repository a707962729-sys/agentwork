/**
 * ACP 服务器
 * 实现 Agent Client Protocol，支持编辑器集成
 */

import {
  ACPRequest,
  ACPResponse,
  ACPNotification,
  ACPServerConfig,
  ACPInitializeResult,
  ACPTool,
  ACPSkill,
  ACPTask,
  ACPTaskStatus,
  ACPError
} from './types.js';
import * as readline from 'readline';
import * as crypto from 'crypto';

/**
 * ACP 服务器
 */
export class ACPServer {
  private config: ACPServerConfig;
  private sessions: Map<string, any> = new Map();
  private tasks: Map<string, ACPTask> = new Map();
  private tools: Map<string, ACPTool> = new Map();
  private skills: Map<string, ACPSkill> = new Map();
  private requestHandlers: Map<string, (params: any) => Promise<any>> = new Map();
  private running: boolean = false;

  constructor(config: ACPServerConfig) {
    this.config = config;
    this.setupDefaultHandlers();
  }

  /**
   * 设置默认请求处理器
   */
  private setupDefaultHandlers(): void {
    // 初始化
    this.requestHandlers.set('initialize', async (params) => {
      return this.handleInitialize(params);
    });

    // 获取能力
    this.requestHandlers.set('capabilities/get', async () => {
      return this.config.capabilities;
    });

    // 工具列表
    this.requestHandlers.set('tools/list', async () => {
      return { tools: Array.from(this.tools.values()) };
    });

    // 技能列表
    this.requestHandlers.set('skills/list', async () => {
      return { skills: Array.from(this.skills.values()) };
    });

    // 执行任务
    this.requestHandlers.set('tasks/run', async (params) => {
      return this.handleRunTask(params);
    });

    // 获取任务状态
    this.requestHandlers.set('tasks/status', async (params) => {
      const task = this.tasks.get(params.taskId);
      return task || null;
    });

    // 取消任务
    this.requestHandlers.set('tasks/cancel', async (params) => {
      return this.handleCancelTask(params.taskId);
    });
  }

  /**
   * 处理初始化
   */
  private handleInitialize(params: any): ACPInitializeResult {
    return {
      protocolVersion: '1.0.0',
      capabilities: this.config.capabilities,
      serverInfo: {
        name: this.config.name,
        version: this.config.version
      }
    };
  }

  /**
   * 处理运行任务
   */
  private async handleRunTask(params: any): Promise<{ taskId: string }> {
    const taskId = crypto.randomUUID();
    
    const task: ACPTask = {
      id: taskId,
      status: 'pending',
      createdAt: new Date()
    };
    
    this.tasks.set(taskId, task);

    // 异步执行任务
    this.executeTask(taskId, params).catch(error => {
      const t = this.tasks.get(taskId);
      if (t) {
        t.status = 'failed';
        t.error = error.message;
        t.completedAt = new Date();
      }
    });

    return { taskId };
  }

  /**
   * 执行任务
   */
  private async executeTask(taskId: string, params: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'running';
    
    try {
      // 检查是否有自定义处理器
      const customHandler = this.requestHandlers.get('tasks/execute');
      
      if (customHandler) {
        // 使用自定义处理器
        const result = await customHandler({ taskId, ...params });
        task.status = 'completed';
        task.result = result;
      } else {
        // 默认实现：简单等待
        await new Promise(resolve => setTimeout(resolve, 1000));
        task.status = 'completed';
        task.result = { message: 'Task completed successfully' };
      }
      
      task.completedAt = new Date();
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      task.completedAt = new Date();
    }
  }

  /**
   * 处理取消任务
   */
  private handleCancelTask(taskId: string): { success: boolean } {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'running') {
      task.status = 'cancelled';
      task.completedAt = new Date();
      return { success: true };
    }
    return { success: false };
  }

  /**
   * 注册工具
   */
  registerTool(tool: ACPTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * 注册技能
   */
  registerSkill(skill: ACPSkill): void {
    this.skills.set(skill.name, skill);
  }

  /**
   * 注册自定义请求处理器
   */
  on(method: string, handler: (params: any) => Promise<any>): void {
    this.requestHandlers.set(method, handler);
  }

  /**
   * 处理请求
   */
  private async handleRequest(request: ACPRequest): Promise<ACPResponse> {
    const handler = this.requestHandlers.get(request.method);
    
    if (!handler) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      };
    }

    try {
      const result = await handler(request.params);
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error.message
        }
      };
    }
  }

  /**
   * 发送通知
   */
  sendNotification(method: string, params?: Record<string, any>): void {
    const notification: ACPNotification = {
      jsonrpc: '2.0',
      method,
      params
    };
    console.log(JSON.stringify(notification));
  }

  /**
   * 启动服务器 (stdio 模式)
   */
  async start(): Promise<void> {
    this.running = true;
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', async (line) => {
      try {
        const request: ACPRequest = JSON.parse(line);
        const response = await this.handleRequest(request);
        console.log(JSON.stringify(response));
      } catch (error) {
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error'
          }
        }));
      }
    });

    rl.on('close', () => {
      this.running = false;
    });
  }

  /**
   * 停止服务器
   */
  stop(): void {
    this.running = false;
  }
}

export default ACPServer;