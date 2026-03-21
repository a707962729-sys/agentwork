/**
 * Agent 执行器 - 真正调用 OpenClaw sessions_spawn 执行技能
 */

import { Skill } from '../types.js';
import { DatabaseManager } from '../db/index.js';

// 声明 sessions_spawn 工具的类型
declare function sessions_spawn(options: {
  prompt: string;
  tools?: string[];
  model?: string;
  timeoutMs?: number;
}): Promise<{
  result: any;
  sessionId: string;
}>;

export interface AgentRunnerConfig {
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

export class AgentRunner {
  private config: AgentRunnerConfig;
  private db: DatabaseManager;

  constructor(db: DatabaseManager, config: AgentRunnerConfig = {}) {
    this.db = db;
    this.config = {
      model: config.model || 'qwen-cn/qwen3-max-2026-01-23',
      timeout: config.timeout || 300000, // 5分钟超时
      maxRetries: config.maxRetries || 3
    };
  }

  /**
   * 执行技能 - 真正调用 AI Agent
   */
  async executeSkill(skill: Skill, input: Record<string, any>, context: Record<string, any> = {}): Promise<any> {
    // 加载技能 SKILL.md 内容
    const skillContent = await this.loadSkillContent(skill);
    
    // 构建 prompt（技能说明 + 输入参数）
    const prompt = this.buildPrompt(skill, skillContent, input, context);
    
    // 获取技能所需的工具列表
    const tools = this.getRequiredTools(skill);
    
    // 调用 OpenClaw sessions_spawn 创建子代理
    try {
      // @ts-ignore - sessions_spawn 是全局可用的工具
      const session = await sessions_spawn({
        prompt,
        tools,
        model: this.config.model,
        timeoutMs: this.config.timeout
      });
      
      return session.result;
    } catch (error) {
      const skillName = skill.manifest ? skill.manifest.name : 'unknown';
      console.error(`Agent execution failed for skill ${skillName}:`, error);
      throw error;
    }
  }

  /**
   * 加载技能 SKILL.md 内容
   */
  private async loadSkillContent(skill: Skill): Promise<string> {
    if (skill.content) {
      return skill.content;
    }
    
    // 如果数据库中没有缓存内容，从文件系统读取
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const skillMdPath = path.join(skill.path, 'SKILL.md');
      return await fs.readFile(skillMdPath, 'utf-8');
    } catch (error) {
      const skillName = skill.manifest ? skill.manifest.name : 'unknown';
      console.warn(`Could not read SKILL.md for skill ${skillName}:`, error);
      return skill.manifest ? skill.manifest.description : '';
    }
  }

  /**
   * 构建执行 prompt
   */
  private buildPrompt(skill: Skill, skillContent: string, input: Record<string, any>, context: Record<string, any>): string {
    const skillName = skill.manifest ? skill.manifest.name : 'unknown';
    const skillDescription = skill.manifest ? skill.manifest.description : '';
    
    const promptParts = [];
    
    // 技能基本信息
    promptParts.push(`# 执行技能: ${skillName}`);
    promptParts.push(`## 技能描述`);
    promptParts.push(skillDescription);
    
    // 技能详细说明（来自 SKILL.md）
    if (skillContent && skillContent.trim()) {
      promptParts.push(`## 技能详细说明`);
      promptParts.push(skillContent);
    }
    
    // 输入参数
    if (Object.keys(input).length > 0) {
      promptParts.push(`## 输入参数`);
      promptParts.push(JSON.stringify(input, null, 2));
    }
    
    // 上下文信息
    if (Object.keys(context).length > 0) {
      promptParts.push(`## 执行上下文`);
      promptParts.push(JSON.stringify(context, null, 2));
    }
    
    // 执行指令
    promptParts.push(`## 执行指令`);
    promptParts.push(`请严格按照上述技能说明执行任务，并返回结构化的结果。`);
    promptParts.push(`如果遇到问题，请详细描述错误信息。`);
    
    return promptParts.join('\n\n');
  }

  /**
   * 获取技能所需的工具列表
   */
  private getRequiredTools(skill: Skill): string[] {
    // 从技能 manifest 中获取需要的工具
    const requiredTools = (skill.manifest && skill.manifest.requires) ? skill.manifest.requires : [];
    
    // 添加基础工具
    const baseTools = ['read', 'write', 'edit', 'exec', 'web_search'];
    
    // 合并并去重
    const allTools = [...new Set([...requiredTools, ...baseTools])];
    
    return allTools;
  }

  /**
   * 带重试的技能执行
   */
  async executeSkillWithRetry(skill: Skill, input: Record<string, any>, context: Record<string, any> = {}): Promise<any> {
    let lastError: Error | null = null;
    const skillName = (skill.manifest && skill.manifest.name) ? skill.manifest.name : 'unknown';
    const maxRetries = this.config.maxRetries || 3;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeSkill(skill, input, context);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt + 1} failed for skill ${skillName}:`, error);
        
        if (attempt < maxRetries) {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError!;
  }
}