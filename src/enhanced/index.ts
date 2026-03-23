/**
 * AgentWork 增强模块使用示例
 * 展示如何使用 DeerFlow 风格的新组件
 */

import { SkillsRegistry, SkillMatcher } from '../skills/index.js';
import { FileCache } from '../cache/index.js';
import { TemplateRenderer } from '../templates/index.js';
import { ScriptExecutor } from '../executor/index.js';
import { DatabaseManager } from '../db/index.js';
import { Skill } from '../types.js';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * 增强版 Agent 执行器
 * 集成智能匹配、缓存、模板渲染
 */
export class EnhancedAgentRunner {
  private skillsRegistry: SkillsRegistry;
  private skillMatcher: SkillMatcher;
  private cache: FileCache;
  private templateRenderer: TemplateRenderer;
  private scriptExecutor: ScriptExecutor;
  private db: DatabaseManager;

  constructor(db: DatabaseManager, skillsDir: string) {
    this.db = db;
    this.skillsRegistry = new SkillsRegistry(db, skillsDir);
    this.skillMatcher = new SkillMatcher();
    this.cache = new FileCache();
    this.templateRenderer = new TemplateRenderer();
    this.scriptExecutor = new ScriptExecutor();
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    await this.skillsRegistry.init();
    await this.cache.init();
  }

  /**
   * 智能匹配技能并执行
   */
  async matchAndExecute(userInput: string, input: Record<string, any>): Promise<any> {
    // 1. 获取所有技能
    const skills = this.skillsRegistry.list();
    
    // 2. 智能匹配
    const matchResult = this.skillMatcher.matchBest(userInput, skills);
    
    if (!matchResult) {
      return {
        success: false,
        error: 'No matching skill found',
        input: userInput
      };
    }
    
    console.log(`Matched skill: ${matchResult.skill.manifest.name} (score: ${matchResult.score})`);
    
    // 3. 执行技能
    return this.executeSkill(matchResult.skill, input);
  }

  /**
   * 执行技能（带缓存）
   */
  async executeSkill(skill: Skill, input: Record<string, any>): Promise<any> {
    // 生成缓存 key
    const cacheKey = this.cache.generateKey(
      skill.manifest.name,
      JSON.stringify(input)
    );
    
    // 尝试从缓存获取
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for skill: ${skill.manifest.name}`);
      return cached;
    }
    
    // 检查是否有脚本
    const hasScript = await this.hasScript(skill);
    
    let result: any;
    
    if (hasScript) {
      // 执行脚本
      result = await this.executeScript(skill, input);
    } else {
      // 调用 AI
      result = await this.callAI(skill, input);
    }
    
    // 缓存结果
    await this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * 检查技能是否有脚本
   */
  private async hasScript(skill: Skill): Promise<boolean> {
    const scriptsPath = path.join(skill.path, 'scripts');
    try {
      const entries = await fs.readdir(scriptsPath);
      return entries.some(e => e.endsWith('.py') || e.endsWith('.js') || e.endsWith('.ts'));
    } catch {
      return false;
    }
  }

  /**
   * 执行脚本
   */
  private async executeScript(skill: Skill, input: Record<string, any>): Promise<any> {
    // 查找脚本
    const scriptsPath = path.join(skill.path, 'scripts');
    const entries = await fs.readdir(scriptsPath);
    
    // 优先 Python，其次 Node.js
    let script = entries.find(e => e.endsWith('.py')) || 
                 entries.find(e => e.endsWith('.js') || e.endsWith('.ts'));
    
    if (!script) {
      return { success: false, error: 'No executable script found' };
    }
    
    const result = await this.scriptExecutor.execute(skill.path, {
      script,
      input,
      timeout: 60000
    });
    
    return result;
  }

  /**
   * 调用 AI
   */
  private async callAI(skill: Skill, input: Record<string, any>): Promise<any> {
    // 这里可以集成 AgentRunner
    // 暂时返回模拟结果
    return {
      success: true,
      skill: skill.manifest.name,
      input,
      note: 'AI execution not implemented in this demo'
    };
  }

  /**
   * 渲染输出
   */
  async renderOutput(skill: Skill, data: Record<string, any>, templateName: string = 'output'): Promise<string> {
    return this.templateRenderer.renderTemplate(skill, templateName, data);
  }
}

// 导出所有模块
export { SkillsRegistry, SkillMatcher } from '../skills/index.js';
export { FileCache } from '../cache/index.js';
export { TemplateRenderer } from '../templates/index.js';
export { ScriptExecutor } from '../executor/index.js';