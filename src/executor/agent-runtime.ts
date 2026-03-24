/**
 * AgentWork Executor — Agent 运行时
 * 核心执行循环：加载配置 → 调用 LLM → 执行工具 → 返回结果
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  AgentConfig,
  Session,
  Message,
  LLMMessage,
  ToolContext,
  TaskOutput,
} from './types.js';
import { ExecutorDB } from './db.js';
import { LLMAdapter } from './llm-adapter.js';
import { ToolRegistry } from './tool-registry.js';

// ============ 运行时选项 ============

export interface RuntimeOptions {
  db: ExecutorDB;
  tools: ToolRegistry;
  onProgress?: (taskId: string, progress: number, message?: string) => void;
  onMessage?: (taskId: string, message: string) => void;
}

// ============ Agent 运行时 ============

export class AgentRuntime {
  private db: ExecutorDB;
  private tools: ToolRegistry;
  private onProgress?: RuntimeOptions['onProgress'];
  private onMessage?: RuntimeOptions['onMessage'];

  constructor(opts: RuntimeOptions) {
    this.db = opts.db;
    this.tools = opts.tools;
    this.onProgress = opts.onProgress;
    this.onMessage = opts.onMessage;
  }

  /**
   * 主执行入口
   * @param task 任务
   * @param agent Agent 配置（包含模型信息）
   */
  async execute(task: Task, agent: AgentConfig): Promise<TaskOutput> {
    const { id: taskId, agentId, input } = task;

    // 构建 LLM Adapter（每次用 agent 配置）
    const llm = new LLMAdapter({
      model: agent.model,
      modelType: agent.modelType,
      apiKey: agent.apiKey ?? process.env.OPENAI_API_KEY ?? '',
      baseUrl: agent.baseUrl,
      maxTokens: agent.maxTokens,
      temperature: agent.temperature,
    });

    // 1. 更新任务状态
    this.db.updateTask(taskId, {
      status: 'running',
      startedAt: new Date().toISOString(),
    });
    this.reportProgress(taskId, 5);

    try {
      // 2. 获取或创建会话
      let session = task.sessionId ? this.db.getSession(task.sessionId) : undefined;
      if (!session) {
        session = this.createSession(agentId, taskId);
      }

      // 3. 构建消息历史
      const messages = await this.buildMessages(session, input, agent);
      this.reportProgress(taskId, 15);

      // 4. 获取启用的工具
      const enabledTools = this.tools.getByIds(agent.tools ?? []);
      this.reportProgress(taskId, 20);

      // 5. LLM 调用循环
      this.reportMessage(taskId, `[AgentRuntime] 开始执行，工具数量: ${enabledTools.length}`);
      const output = await this.runLLMLoop(taskId, session, messages, enabledTools, llm, agent);
      this.reportProgress(taskId, 95);

      // 6. 更新任务完成
      this.db.updateTask(taskId, {
        status: 'completed',
        output,
        completedAt: new Date().toISOString(),
      });
      this.reportProgress(taskId, 100);
      this.reportMessage(taskId, '[AgentRuntime] 任务完成');

      return output;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.reportMessage(taskId, `[AgentRuntime] 执行失败: ${errorMsg}`);

      const retryCount = task.retryCount ?? 0;
      if (retryCount < (task.maxRetries ?? 3)) {
        this.db.updateTask(taskId, {
          status: 'pending',
          retryCount: retryCount + 1,
          error: errorMsg,
        });
      } else {
        this.db.updateTask(taskId, {
          status: 'failed',
          error: errorMsg,
          completedAt: new Date().toISOString(),
        });
      }

      throw err;
    }
  }

  // ============ 内部方法 ============

  /**
   * 构建会话（无则创建）
   */
  private createSession(agentId: string, taskId: string): Session {
    const session: Session = {
      id: uuidv4(),
      agentId,
      taskId,
      status: 'active',
      context: {
        recentMessages: [],
        currentTask: taskId,
        toolHistory: [],
        variables: {},
      },
      messageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.createSession(session);

    // 同步更新任务的 sessionId
    this.db.updateTask(taskId, { sessionId: session.id });

    return session;
  }

  /**
   * 构建 LLM 消息列表
   */
  private async buildMessages(
    session: Session,
    input: Task['input'],
    agent: AgentConfig
  ): Promise<LLMMessage[]> {
    const messages: LLMMessage[] = [];

    // 1. 系统提示词
    const systemPrompt = agent.systemPrompt ?? this.defaultSystemPrompt(agent.name);
    messages.push({ role: 'system', content: systemPrompt });

    // 2. 会话历史消息（最近的 20 条）
    const history = this.db.getMessages(session.id, 20);
    for (const msg of history) {
      messages.push({
        role: msg.role,
        content: msg.content,
        name: msg.name,
        toolCallId: msg.toolCallId,
      });
    }

    // 3. 用户输入
    const userContent =
      typeof input.content === 'string'
        ? input.content
        : JSON.stringify(input.content);
    messages.push({ role: 'user', content: userContent });

    return messages;
  }

  /**
   * 默认系统提示词
   */
  private defaultSystemPrompt(agentName: string): string {
    return `你是 ${agentName}，一个专业的 AI 助手。
核心原则：
- 理解用户意图，提供准确、有用的回答
- 使用可用工具完成复杂任务
- 结果要清晰、结构化
- 遇到问题主动说明，不要隐瞒`;
  }

  /**
   * LLM 调用循环（核心）
   */
  private async runLLMLoop(
    taskId: string,
    session: Session,
    messages: LLMMessage[],
    enabledTools: any[],
    llm: LLMAdapter,
    agent: AgentConfig
  ): Promise<TaskOutput> {
    let finish = false;
    let iterations = 0;
    const maxIterations = 50;
    let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    while (!finish && iterations < maxIterations) {
      iterations++;
      this.reportMessage(taskId, `[LLM Loop] 第 ${iterations} 轮调用`);

      const response = await llm.chat(messages, enabledTools);
      const choice = response.choices[0];

      // 累加 token
      if (response.usage) {
        totalUsage.promptTokens += response.usage.promptTokens;
        totalUsage.completionTokens += response.usage.completionTokens;
        totalUsage.totalTokens += response.usage.totalTokens;
      }

      // 记录助手消息
      messages.push({
        role: 'assistant',
        content: choice.message.content ?? '',
        toolCalls: choice.message.toolCalls,
      });

      // 保存到数据库（首轮和工具调用轮保存）
      if (iterations <= 3 || choice.finishReason !== 'stop') {
        this.saveMessage(session.id, {
          id: uuidv4(),
          sessionId: session.id,
          role: 'assistant',
          content: choice.message.content ?? '',
          createdAt: new Date().toISOString(),
        });
      }

      if (choice.finishReason === 'stop') {
        finish = true;
      } else if (choice.finishReason === 'tool_calls') {
        this.reportProgress(taskId, Math.min(20 + iterations * 3, 90));

        // 执行工具调用
        for (const toolCall of choice.message.toolCalls ?? []) {
          const toolId = toolCall.function.name;
          let args: any = {};

          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch {
            args = {};
          }

          this.reportMessage(taskId, `[Tool] ${toolId}(${JSON.stringify(args)})`);

          // 记录 tool_call 消息
          messages.push({
            role: 'assistant',
            content: '',
            toolCalls: [toolCall],
          });

          // 执行工具
          const toolContext: ToolContext = {
            sessionId: session.id,
            taskId,
            agentId: agent.id,
            variables: session.context.variables,
          };

          const result = await this.tools.execute(toolId, args, toolContext);

          // 记录结果
          const resultContent =
            typeof result.output === 'string'
              ? result.output
              : JSON.stringify(result);

          messages.push({
            role: 'tool',
            content: resultContent,
            toolCallId: toolCall.id,
            name: toolId,
          });

          // 保存工具消息
          this.saveMessage(session.id, {
            id: uuidv4(),
            sessionId: session.id,
            role: 'tool',
            content: resultContent,
            toolCallId: toolCall.id,
            name: toolId,
            createdAt: new Date().toISOString(),
          });

          // 更新工具历史
          session.context.toolHistory.push({
            id: toolCall.id,
            type: 'function',
            function: toolCall.function,
          });

          this.reportMessage(
            taskId,
            result.success
              ? `[Tool Result] ✓ ${String(result.output ?? '').slice(0, 120)}`
              : `[Tool Error] ✗ ${result.error}`
          );
        }
      }
    }

    // 提取最终回复
    const finalMessage = messages[messages.length - 1];
    const outputContent =
      finalMessage?.role === 'assistant' && finalMessage?.content
        ? finalMessage.content
        : '(无文本输出)';

    return {
      type: 'text',
      content: outputContent,
      usage: totalUsage.totalTokens > 0 ? totalUsage : undefined,
    };
  }

  /**
   * 保存消息到数据库
   */
  private saveMessage(sessionId: string, message: Message): void {
    try {
      this.db.createMessage(message);
    } catch {
      // 忽略重复写入
    }
  }

  /**
   * 进度上报
   */
  private reportProgress(taskId: string, progress: number): void {
    if (this.onProgress) {
      this.onProgress(taskId, progress);
    }
  }

  /**
   * 消息上报
   */
  private reportMessage(taskId: string, message: string): void {
    if (this.onMessage) {
      this.onMessage(taskId, message);
    }
  }
}
