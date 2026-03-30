/**
 * SubAgent 执行器
 * 负责创建隔离上下文并执行子代理任务
 */

import {
  SubAgentDefinition,
  SubAgentContext,
  SubAgentResult,
  SubAgentMessage,
  SubAgentMiddleware,
  ToolCallRecord
} from './types.js';
import { AgentRunner } from '../agent-engine/AgentRunner.js';
import { DatabaseManager } from '../db/index.js';
import { Skill } from '../types.js';
import { Logger } from '../logging/index.js';
import * as crypto from 'crypto';

/**
 * 执行器配置
 */
export interface ExecutorConfig {
  /** 默认超时时间 (ms) */
  defaultTimeout?: number;
  /** 默认最大迭代次数 */
  defaultMaxIterations?: number;
  /** 是否启用结果摘要 */
  enableSummary?: boolean;
}

/**
 * 执行结果摘要
 */
export interface ExecutionSummary {
  /** 是否成功 */
  success: boolean;
  /** 输出摘要 (截断到指定长度) */
  outputSummary: string;
  /** 关键信息提取 */
  keyPoints?: string[];
  /** 错误摘要 */
  errorSummary?: string;
  /** 执行时长 */
  duration: number;
  /** 迭代次数 */
  iterations: number;
  /** 工具调用次数 */
  toolCallCount: number;
}

/**
 * SubAgent 执行器
 * 
 * 核心职责:
 * 1. 创建隔离的执行上下文
 * 2. 管理中间件生命周期
 * 3. 调用 AgentRunner 执行任务
 * 4. 返回结果摘要
 */
export class SubAgentExecutor {
  private logger = new Logger();
  private db: DatabaseManager;
  private config: ExecutorConfig;
  private activeContexts: Map<string, SubAgentContext> = new Map();

  constructor(db: DatabaseManager, config: ExecutorConfig = {}) {
    this.db = db;
    this.config = {
      defaultTimeout: config.defaultTimeout || 120000,
      defaultMaxIterations: config.defaultMaxIterations || 10,
      enableSummary: config.enableSummary !== false
    };
  }

  /**
   * 执行子代理任务
   * 
   * @param definition 子代理定义
   * @param task 任务描述
   * @param runner AgentRunner 实例
   * @param parentContext 可选的父上下文
   * @returns 执行结果
   */
  async execute(
    definition: SubAgentDefinition,
    task: string,
    runner: AgentRunner,
    parentContext?: Record<string, any>
  ): Promise<SubAgentResult> {
    const startTime = Date.now();
    const contextId = this.generateContextId(definition.name);
    
    // 1. 创建隔离的执行上下文
    const context = this.createIsolatedContext(
      definition,
      task,
      contextId,
      parentContext
    );
    
    // 注册上下文
    this.activeContexts.set(contextId, context);
    
    try {
      // 2. 执行前置中间件
      await this.runBeforeMiddlewares(definition.middleware, context);
      
      // 3. 执行任务
      const result = await this.executeTask(
        definition,
        task,
        runner,
        context
      );
      
      // 4. 执行后置中间件
      const finalResult = await this.runAfterMiddlewares(
        definition.middleware,
        result
      );
      
      return finalResult;
      
    } catch (error: any) {
      // 错误处理
      const errorResult = this.createErrorResult(
        definition.name,
        error,
        startTime
      );
      
      // 执行错误中间件
      await this.runErrorMiddlewares(
        definition.middleware,
        error,
        context
      );
      
      return errorResult;
      
    } finally {
      // 清理上下文
      this.activeContexts.delete(contextId);
    }
  }

  /**
   * 创建隔离的执行上下文
   */
  private createIsolatedContext(
    definition: SubAgentDefinition,
    task: string,
    contextId: string,
    parentContext?: Record<string, any>
  ): SubAgentContext {
    const messages: SubAgentMessage[] = [
      {
        role: 'system',
        content: this.buildSystemPrompt(definition),
        timestamp: new Date()
      },
      {
        role: 'user',
        content: task,
        timestamp: new Date()
      }
    ];

    return {
      agentName: definition.name,
      parentContext: this.sanitizeParentContext(parentContext),
      subagentContext: {
        contextId,
        createdAt: new Date(),
        definition: {
          name: definition.name,
          description: definition.description,
          tools: definition.tools,
          skills: definition.skills
        }
      },
      messages,
      skillsState: new Map(),
      toolCalls: [],
      metadata: {
        lcAgentName: definition.name,
        startedAt: new Date(),
        maxIterations: definition.maxIterations || this.config.defaultMaxIterations,
        timeout: definition.timeout || this.config.defaultTimeout
      }
    };
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(definition: SubAgentDefinition): string {
    const parts: string[] = [];
    
    parts.push(`# 你是子代理: ${definition.name}`);
    
    if (definition.description) {
      parts.push(`## 职责\n${definition.description}`);
    }
    
    if (definition.systemPrompt) {
      parts.push(`## 指令\n${definition.systemPrompt}`);
    }
    
    if (definition.tools && definition.tools.length > 0) {
      parts.push(`## 可用工具\n${definition.tools.join(', ')}`);
    }
    
    if (definition.skills && definition.skills.length > 0) {
      parts.push(`## 可用技能\n${definition.skills.join(', ')}`);
    }
    
    // 添加执行约束
    parts.push(`## 执行约束
- 专注于任务目标，不要偏离
- 按需调用工具和技能
- 提供简洁明了的结果
- 遇到错误时清晰报告问题`);

    return parts.join('\n\n');
  }

  /**
   * 清理父上下文，只保留安全信息
   */
  private sanitizeParentContext(
    parentContext?: Record<string, any>
  ): Record<string, any> {
    if (!parentContext) return {};
    
    // 只保留白名单字段
    const allowedKeys = ['taskId', 'workflowId', 'userId', 'projectId'];
    const sanitized: Record<string, any> = {};
    
    for (const key of allowedKeys) {
      if (parentContext[key] !== undefined) {
        sanitized[key] = parentContext[key];
      }
    }
    
    return sanitized;
  }

  /**
   * 执行任务
   */
  private async executeTask(
    definition: SubAgentDefinition,
    task: string,
    runner: AgentRunner,
    context: SubAgentContext
  ): Promise<SubAgentResult> {
    const startTime = Date.now();
    const timeout = definition.timeout || this.config.defaultTimeout;
    const maxIterations = definition.maxIterations || this.config.defaultMaxIterations;
    
    let iterations = 0;
    let totalTokens = 0;
    let currentOutput = '';
    
    // 设置超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), timeout);
    });
    
    try {
      // 构建技能输入
      const skillInput = {
        task,
        agentName: definition.name,
        description: definition.description,
        tools: definition.tools,
        skills: definition.skills,
        context: context.parentContext
      };
      
      // 使用 Promise.race 处理超时
      const result = await Promise.race([
        this.executeWithRunner(runner, definition, skillInput, context),
        timeoutPromise
      ]);
      
      // 提取结果
      if (typeof result === 'string') {
        currentOutput = result;
      } else if (result && typeof result === 'object') {
        currentOutput = result.content || result.output || JSON.stringify(result);
        totalTokens = result.tokensUsed || 0;
        
        // 记录工具调用
        if (result.toolCalls) {
          for (const tc of result.toolCalls) {
            context.toolCalls.push({
              id: tc.id || crypto.randomUUID(),
              name: tc.name,
              args: tc.args || {},
              result: tc.result,
              timestamp: new Date()
            });
          }
        }
      }
      
      iterations = 1; // 单次执行
      
    } catch (error: any) {
      return this.createErrorResult(definition.name, error, startTime);
    }
    
    const duration = Date.now() - startTime;
    
    // 构建结果
    return {
      success: true,
      output: this.summarizeOutput(currentOutput),
      structuredOutput: {
        raw: currentOutput,
        iterations,
        tokensUsed: totalTokens
      },
      stats: {
        iterations,
        toolCalls: context.toolCalls.length,
        tokensUsed: totalTokens,
        durationMs: duration
      },
      metadata: {
        agentName: definition.name,
        lcAgentName: definition.name,
        startedAt: new Date(startTime),
        completedAt: new Date()
      }
    };
  }

  /**
   * 使用 AgentRunner 执行
   */
  private async executeWithRunner(
    runner: AgentRunner,
    definition: SubAgentDefinition,
    input: Record<string, any>,
    context: SubAgentContext
  ): Promise<any> {
    // 创建一个虚拟技能用于执行
    const virtualSkill = {
      path: `/virtual/${definition.name}`,
      manifest: {
        name: definition.name,
        description: definition.description,
        category: 'virtual'
      },
      content: definition.systemPrompt || ''
    };
    
    // 调用 runner
    return runner.executeSkill(virtualSkill, input, context.subagentContext);
  }

  /**
   * 生成输出摘要
   */
  private summarizeOutput(output: string, maxLength: number = 500): string {
    if (!output) return '';
    
    // 如果输出很短，直接返回
    if (output.length <= maxLength) {
      return output.trim();
    }
    
    // 截断并添加省略号
    const truncated = output.substring(0, maxLength).trim();
    const lastSpace = truncated.lastIndexOf(' ');
    
    // 在最后一个完整单词处截断
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * 执行前置中间件
   */
  private async runBeforeMiddlewares(
    middlewares: SubAgentMiddleware[] = [],
    context: SubAgentContext
  ): Promise<SubAgentContext> {
    let currentContext = context;
    
    for (const middleware of middlewares) {
      if (middleware.beforeInvoke) {
        currentContext = await middleware.beforeInvoke(currentContext);
      }
    }
    
    return currentContext;
  }

  /**
   * 执行后置中间件
   */
  private async runAfterMiddlewares(
    middlewares: SubAgentMiddleware[] = [],
    result: SubAgentResult
  ): Promise<SubAgentResult> {
    let currentResult = result;
    
    for (const middleware of middlewares) {
      if (middleware.afterInvoke) {
        currentResult = await middleware.afterInvoke(currentResult);
      }
    }
    
    return currentResult;
  }

  /**
   * 执行错误中间件
   */
  private async runErrorMiddlewares(
    middlewares: SubAgentMiddleware[] = [],
    error: Error,
    context: SubAgentContext
  ): Promise<void> {
    for (const middleware of middlewares) {
      if (middleware.onError) {
        try {
          await middleware.onError(error, context);
        } catch (e) {
          this.logger.error(`Middleware ${middleware.name} error handler failed: ${e instanceof Error ? e.message : e}`);
        }
      }
    }
  }

  /**
   * 创建错误结果
   */
  private createErrorResult(
    agentName: string,
    error: Error,
    startTime: number
  ): SubAgentResult {
    return {
      success: false,
      output: '',
      error: error.message,
      stats: {
        iterations: 0,
        toolCalls: 0,
        tokensUsed: 0,
        durationMs: Date.now() - startTime
      },
      metadata: {
        agentName,
        lcAgentName: agentName,
        startedAt: new Date(startTime),
        completedAt: new Date()
      }
    };
  }

  /**
   * 生成上下文 ID
   */
  private generateContextId(agentName: string): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `${agentName}-${timestamp}-${random}`;
  }

  /**
   * 获取活跃上下文
   */
  getActiveContext(contextId: string): SubAgentContext | undefined {
    return this.activeContexts.get(contextId);
  }

  /**
   * 获取所有活跃上下文
   */
  getAllActiveContexts(): Map<string, SubAgentContext> {
    return new Map(this.activeContexts);
  }

  /**
   * 取消执行
   */
  cancel(contextId: string): boolean {
    const context = this.activeContexts.get(contextId);
    if (context) {
      // 标记为已取消
      context.metadata.cancelled = true;
      this.activeContexts.delete(contextId);
      return true;
    }
    return false;
  }
}

export default SubAgentExecutor;