/**
 * SubAgent 管理器
 * 参考 Deep Agents 设计，支持 Context 隔离
 */

import { 
  SubAgentDefinition, 
  SubAgentContext, 
  SubAgentResult,
  SubAgentManagerConfig,
  GeneralPurposeSubAgentConfig
} from './types.js';
import { DatabaseManager } from '../db/index.js';
import { Skill } from '../types.js';
import * as crypto from 'crypto';

/**
 * SubAgent 管理器
 */
export class SubAgentManager {
  private db: DatabaseManager;
  private subagents: Map<string, SubAgentDefinition> = new Map();
  private generalPurposeConfig: GeneralPurposeSubAgentConfig;
  private defaultTimeout: number;
  private defaultMaxIterations: number;
  private mainAgentSkills: string[] = [];
  private mainAgentTools: string[] = [];
  private mainAgentModel?: string;
  private mainAgentSystemPrompt?: string;

  constructor(db: DatabaseManager, config: SubAgentManagerConfig) {
    this.db = db;
    this.defaultTimeout = config.defaultTimeout || 120000;
    this.defaultMaxIterations = config.defaultMaxIterations || 10;
    this.generalPurposeConfig = config.generalPurpose || { enabled: true };

    // 注册自定义子代理
    for (const subagent of config.subagents) {
      this.subagents.set(subagent.name, subagent);
    }
  }

  /**
   * 设置主代理配置（用于 general-purpose 子代理继承）
   */
  setMainAgentConfig(config: {
    skills?: string[];
    tools?: string[];
    model?: string;
    systemPrompt?: string;
  }): void {
    this.mainAgentSkills = config.skills || [];
    this.mainAgentTools = config.tools || [];
    this.mainAgentModel = config.model;
    this.mainAgentSystemPrompt = config.systemPrompt;
  }

  /**
   * 获取所有可用子代理名称
   */
  getAvailableSubAgents(): string[] {
    const names = Array.from(this.subagents.keys());
    if (this.generalPurposeConfig.enabled) {
      names.push('general-purpose');
    }
    return names;
  }

  /**
   * 获取子代理定义
   */
  getSubAgent(name: string): SubAgentDefinition | undefined {
    if (name === 'general-purpose') {
      return this.getGeneralPurposeSubAgent();
    }
    return this.subagents.get(name);
  }

  /**
   * 获取 general-purpose 子代理定义
   */
  private getGeneralPurposeSubAgent(): SubAgentDefinition {
    return {
      name: 'general-purpose',
      description: '通用子代理，继承主代理的能力，用于委派复杂任务',
      systemPrompt: this.generalPurposeConfig.systemPrompt || 
        this.mainAgentSystemPrompt || 
        '你是一个通用助手，帮助完成各种任务。',
      tools: [...this.mainAgentTools, ...(this.generalPurposeConfig.additionalTools || [])],
      skills: this.mainAgentSkills, // 继承主代理技能
      model: this.generalPurposeConfig.model || this.mainAgentModel,
      maxIterations: this.defaultMaxIterations,
      timeout: this.defaultTimeout
    };
  }

  /**
   * 创建子代理上下文
   */
  createContext(
    agentName: string,
    parentContext?: Record<string, any>,
    task?: string
  ): SubAgentContext {
    const subagent = this.getSubAgent(agentName);
    if (!subagent) {
      throw new Error(`SubAgent not found: ${agentName}`);
    }

    return {
      agentName,
      parentContext: parentContext || {},
      subagentContext: {},
      messages: [{
        role: 'system',
        content: subagent.systemPrompt,
        timestamp: new Date()
      }, {
        role: 'user',
        content: task || '',
        timestamp: new Date()
      }],
      skillsState: new Map(),
      toolCalls: [],
      metadata: {
        lcAgentName: agentName,
        startedAt: new Date()
      }
    };
  }

  /**
   * 调用子代理
   */
  async invoke(
    name: string,
    task: string,
    parentContext?: Record<string, any>
  ): Promise<SubAgentResult> {
    const subagent = this.getSubAgent(name);
    if (!subagent) {
      return {
        success: false,
        output: '',
        stats: { iterations: 0, toolCalls: 0, tokensUsed: 0, durationMs: 0 },
        error: `SubAgent not found: ${name}`,
        metadata: {
          agentName: name,
          lcAgentName: name,
          startedAt: new Date(),
          completedAt: new Date()
        }
      };
    }

    const startTime = Date.now();
    const context = this.createContext(name, parentContext, task);

    try {
      // TODO: 实际执行逻辑需要集成 AI Provider
      // 这里返回模拟结果
      const result: SubAgentResult = {
        success: true,
        output: `子代理 ${name} 完成任务: ${task.substring(0, 100)}...`,
        stats: {
          iterations: 1,
          toolCalls: 0,
          tokensUsed: 0,
          durationMs: Date.now() - startTime
        },
        metadata: {
          agentName: name,
          lcAgentName: name,
          startedAt: new Date(startTime),
          completedAt: new Date()
        }
      };

      return result;
    } catch (error: any) {
      return {
        success: false,
        output: '',
        stats: {
          iterations: 0,
          toolCalls: 0,
          tokensUsed: 0,
          durationMs: Date.now() - startTime
        },
        error: error.message,
        metadata: {
          agentName: name,
          lcAgentName: name,
          startedAt: new Date(startTime),
          completedAt: new Date()
        }
      };
    }
  }

  /**
   * 根据描述匹配最合适的子代理
   */
  matchSubAgent(taskDescription: string): string | null {
    // 简单关键词匹配，未来可以用向量相似度
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const [name, subagent] of this.subagents) {
      const score = this.calculateMatchScore(taskDescription, subagent.description);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = name;
      }
    }

    // 如果没有好的匹配，使用 general-purpose
    if (bestScore < 0.3 && this.generalPurposeConfig.enabled) {
      return 'general-purpose';
    }

    return bestMatch;
  }

  /**
   * 计算匹配分数
   */
  private calculateMatchScore(task: string, description: string): number {
    const taskWords = task.toLowerCase().split(/\s+/);
    const descWords = description.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const word of taskWords) {
      if (descWords.some(dw => dw.includes(word) || word.includes(dw))) {
        matches++;
      }
    }
    
    return matches / taskWords.length;
  }
}

export default SubAgentManager;