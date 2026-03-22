/**
 * ACP 适配器
 * 将 AgentWork 适配到 ACP 协议
 */

import { ACPServer } from './server.js';
import { ACPTool, ACPSkill, ACPCapabilities, ACPServerConfig } from './types.js';
import { AgentRunner } from '../agent-engine/AgentRunner.js';
import { SubAgentManager } from '../subagents/manager.js';
import { DatabaseManager } from '../db/index.js';
import { Skill } from '../types.js';

/**
 * AgentWork ACP 适配器配置
 */
export interface AgentWorkACPAdapterConfig {
  /** 服务器名称 */
  name?: string;
  
  /** 服务器版本 */
  version?: string;
  
  /** 数据库管理器 */
  db: DatabaseManager;
  
  /** Agent Runner */
  agentRunner: AgentRunner;
  
  /** SubAgent 管理器 */
  subagentManager?: SubAgentManager;
  
  /** 技能列表 */
  skills?: Skill[];
}

/**
 * AgentWork ACP 适配器
 */
export class AgentWorkACPAdapter {
  private server: ACPServer;
  private db: DatabaseManager;
  private agentRunner: AgentRunner;
  private subagentManager?: SubAgentManager;
  private skills: Skill[];

  constructor(config: AgentWorkACPAdapterConfig) {
    this.db = config.db;
    this.agentRunner = config.agentRunner;
    this.subagentManager = config.subagentManager;
    this.skills = config.skills || [];

    // 创建 ACP 服务器
    const serverConfig: ACPServerConfig = {
      name: config.name || 'AgentWork',
      version: config.version || '1.0.0',
      capabilities: {
        streaming: true,
        tools: true,
        skills: true,
        subagents: !!config.subagentManager,
        memory: true
      },
      timeout: 120000
    };

    this.server = new ACPServer(serverConfig);
    this.setupHandlers();
    this.registerSkills();
    this.registerTools();
  }

  /**
   * 设置自定义处理器
   */
  private setupHandlers(): void {
    // 处理任务执行
    this.server.on('tasks/run', async (params) => {
      return this.handleRunTask(params);
    });

    // 处理聊天
    this.server.on('chat', async (params) => {
      return this.handleChat(params);
    });

    // 处理子代理调用
    if (this.subagentManager) {
      this.server.on('subagents/invoke', async (params) => {
        return this.handleSubAgentInvoke(params);
      });

      this.server.on('subagents/list', async () => {
        return {
          subagents: this.subagentManager!.getAvailableSubAgents().map(name => ({
            name,
            description: this.subagentManager!.getSubAgent(name)?.description || ''
          }))
        };
      });
    }
  }

  /**
   * 注册技能
   */
  private registerSkills(): void {
    for (const skill of this.skills) {
      this.server.registerSkill({
        name: skill.manifest.name,
        description: skill.manifest.description,
        triggers: skill.manifest.triggers
      });
    }
  }

  /**
   * 注册工具
   */
  private registerTools(): void {
    // 文件操作工具
    this.server.registerTool({
      name: 'fs_read',
      description: '读取文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' }
        },
        required: ['path']
      }
    });

    this.server.registerTool({
      name: 'fs_write',
      description: '写入文件',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          content: { type: 'string', description: '文件内容' }
        },
        required: ['path', 'content']
      }
    });

    // Shell 执行工具
    this.server.registerTool({
      name: 'shell_exec',
      description: '执行 shell 命令',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: '命令' },
          cwd: { type: 'string', description: '工作目录' }
        },
        required: ['command']
      }
    });

    // Web 搜索工具
    this.server.registerTool({
      name: 'web_search',
      description: '搜索网络',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索查询' }
        },
        required: ['query']
      }
    });
  }

  /**
   * 处理任务执行
   */
  private async handleRunTask(params: any): Promise<any> {
    const { task, skill, agent, inputs } = params;

    // 如果指定了子代理
    if (agent && this.subagentManager) {
      const result = await this.subagentManager.invoke(agent, task, inputs);
      return {
        success: result.success,
        output: result.output,
        stats: result.stats
      };
    }

    // 默认使用 AgentRunner
    // TODO: 实际调用逻辑
    return {
      success: true,
      output: `执行任务: ${task}`,
      stats: {
        iterations: 1,
        toolCalls: 0,
        tokensUsed: 0,
        durationMs: 100
      }
    };
  }

  /**
   * 处理聊天
   */
  private async handleChat(params: any): Promise<any> {
    const { message, sessionId } = params;

    // TODO: 实际聊天逻辑
    return {
      response: `收到消息: ${message}`,
      sessionId
    };
  }

  /**
   * 处理子代理调用
   */
  private async handleSubAgentInvoke(params: any): Promise<any> {
    if (!this.subagentManager) {
      throw new Error('SubAgent manager not configured');
    }

    const { name, task, context } = params;
    const result = await this.subagentManager.invoke(name, task, context);

    return {
      success: result.success,
      output: result.output,
      stats: result.stats,
      metadata: result.metadata
    };
  }

  /**
   * 获取 ACP 服务器
   */
  getServer(): ACPServer {
    return this.server;
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    await this.server.start();
  }

  /**
   * 停止服务器
   */
  stop(): void {
    this.server.stop();
  }
}

/**
 * 创建 AgentWork ACP 适配器
 */
export function createACPAdapter(config: AgentWorkACPAdapterConfig): AgentWorkACPAdapter {
  return new AgentWorkACPAdapter(config);
}

export default AgentWorkACPAdapter;