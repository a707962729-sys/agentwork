/**
 * Agent 执行器 - 完全独立运行
 * 技能格式兼容 OpenClaw SKILL.md，但执行不依赖 OpenClaw
 * 直接调用 AI API（智谱GLM、OpenAI兼容接口、Ollama等）
 */

import { Skill } from '../types.js';
import { DatabaseManager } from '../db/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Logger } from '../logging/index.js';

// ESM 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AIProvider {
  name: string;
  apiBase: string;
  model: string;
  apiKey?: string;
}

export interface AgentRunnerConfig {
  defaultModel?: string;
  providers?: Record<string, AIProvider>;
  timeout?: number;
  maxRetries?: number;
}

export class AgentRunner {
  private logger = new Logger();
  private config: AgentRunnerConfig;
  private db: DatabaseManager;
  private providers: Map<string, AIProvider> = new Map();

  constructor(db: DatabaseManager, config: AgentRunnerConfig = {}) {
    this.db = db;
    this.config = {
      defaultModel: config.defaultModel || 'glm-5',
      timeout: config.timeout || 120000,
      maxRetries: config.maxRetries || 3
    };
    
    // 初始化 providers
    if (config.providers) {
      for (const [name, provider] of Object.entries(config.providers)) {
        this.providers.set(name, provider);
      }
    }
    
    // 加载默认 providers
    this.loadDefaultProviders();
  }

  /**
   * 加载默认 AI providers
   */
  private loadDefaultProviders(): void {
    // 智谱 GLM
    if (process.env.ZHIPU_API_KEY || process.env.AI_API_KEY) {
      this.providers.set('glm', {
        name: 'glm',
        apiBase: process.env.ZHIPU_API_BASE || 'https://open.bigmodel.cn/api/paas/v4',
        model: process.env.ZHIPU_MODEL || 'glm-5',
        apiKey: process.env.ZHIPU_API_KEY || process.env.AI_API_KEY
      });
    }
    
    // OpenAI 兼容接口
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', {
        name: 'openai',
        apiBase: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    // Ollama 本地模型
    this.providers.set('ollama', {
      name: 'ollama',
      apiBase: process.env.OLLAMA_API_BASE || 'http://localhost:11434/v1',
      model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      apiKey: 'ollama'
    });
    
    // DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      this.providers.set('deepseek', {
        name: 'deepseek',
        apiBase: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY
      });
    }
  }

  /**
   * 获取可用的 provider
   */
  private getAvailableProvider(): AIProvider | null {
    // 优先级：glm > openai > deepseek > ollama
    const priority = ['glm', 'openai', 'deepseek', 'ollama'];
    
    for (const name of priority) {
      const provider = this.providers.get(name);
      if (provider && provider.apiKey) {
        return provider;
      }
    }
    
    // 检查 ollama 是否可用
    return this.providers.get('ollama');
  }

  /**
   * 执行技能
   */
  async executeSkill(skill: Skill, input: Record<string, any>, context: Record<string, any> = {}): Promise<any> {
    const skillContent = await this.loadSkillContent(skill);
    const prompt = this.buildPrompt(skill, skillContent, input, context);
    
    const provider = this.getAvailableProvider();
    
    if (!provider) {
      // 没有 API key，返回模拟结果
      this.logger.warn('No AI API configured, returning mock result');
      return this.getMockResult(skill, input);
    }
    
    return this.callAI(provider, prompt);
  }

  /**
   * 调用 AI API
   */
  private async callAI(provider: AIProvider, prompt: string): Promise<any> {
    this.logger.debug(`    📡 Calling AI: ${provider.name} / ${provider.model}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      this.logger.warn(`    ⏱️ AI call timeout after ${this.config.timeout}ms`);
      controller.abort();
    }, this.config.timeout);
    
    try {
      const response = await fetch(`${provider.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的任务执行助手。请严格按照技能说明执行任务，返回 JSON 格式的结果。不要添加额外的解释。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1024  // 降低以加快响应
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      this.logger.debug(`    ✅ AI response received: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content || '';
      this.logger.debug(`    📝 AI content length: ${content.length} chars`);
      
      // 解析 JSON 结果
      return this.parseAIResponse(content);
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('AI request timeout');
      }
      throw error;
    }
  }

  /**
   * 解析 AI 响应
   */
  private parseAIResponse(content: string): any {
    // 尝试直接解析 JSON
    try {
      return JSON.parse(content);
    } catch {}
    
    // 尝试提取 JSON 块
    const jsonPatterns = [
      /```json\n([\s\S]*?)\n```/,
      /```\n([\s\S]*?)\n```/,
      /\{[\s\S]*\}/
    ];
    
    for (const pattern of jsonPatterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          return JSON.parse(match[1] || match[0]);
        } catch {}
      }
    }
    
    // 返回原始内容
    return {
      success: true,
      content,
      raw: true
    };
  }

  /**
   * 加载技能内容
   */
  private async loadSkillContent(skill: Skill): Promise<string> {
    if (skill.content) {
      return skill.content;
    }
    
    try {
      const skillMdPath = path.join(skill.path, 'SKILL.md');
      return await fs.readFile(skillMdPath, 'utf-8');
    } catch {
      return skill.manifest?.description || '';
    }
  }

  /**
   * 构建执行 prompt
   */
  private buildPrompt(skill: Skill, skillContent: string, input: Record<string, any>, context: Record<string, any>): string {
    const parts: string[] = [];
    
    parts.push(`# 执行技能: ${skill.manifest?.name || 'unknown'}`);
    parts.push(`## 技能说明\n${skill.manifest?.description || ''}`);
    
    if (skillContent) {
      parts.push(`## 详细说明\n${skillContent}`);
    }
    
    if (Object.keys(input).length > 0) {
      parts.push(`## 输入参数\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``);
    }
    
    if (Object.keys(context).length > 0) {
      parts.push(`## 执行上下文\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``);
    }
    
    parts.push(`## 输出要求\n返回 JSON 格式的结果，格式如下：\n\`\`\`json\n{\n  "success": true,\n  // 其他字段根据技能说明\n}\n\`\`\``);
    
    return parts.join('\n\n');
  }

  /**
   * 获取模拟结果
   */
  private getMockResult(skill: Skill, input: Record<string, any>): any {
    const skillName = skill.manifest?.name || 'unknown';
    
    const mocks: Record<string, any> = {
      'web-search': {
        success: true,
        results: [
          { title: `[模拟] ${input.query || '搜索'} 结果 1`, url: 'https://example.com/1', snippet: '模拟搜索结果', source: 'example.com' },
          { title: `[模拟] ${input.query || '搜索'} 结果 2`, url: 'https://example.com/2', snippet: '模拟搜索结果', source: 'example.com' },
          { title: `[模拟] ${input.query || '搜索'} 结果 3`, url: 'https://example.com/3', snippet: '模拟搜索结果', source: 'example.com' }
        ],
        total: 3,
        _mock: true
      },
      'article-outline': {
        success: true,
        title: `${input.topic || '文章'} 大纲`,
        summary: '模拟生成的文章摘要',
        sections: [
          { id: 's1', title: '引言', points: ['背景', '目的'] },
          { id: 's2', title: '主体', points: ['核心内容', '分析'] },
          { id: 's3', title: '结论', points: ['总结', '建议'] }
        ],
        estimatedWordCount: 1500,
        _mock: true
      },
      'article-writing': {
        success: true,
        title: `${input.topic || '文章'} 标题`,
        summary: '模拟文章摘要',
        content: `# ${input.topic || '文章'}\n\n这是模拟生成的文章内容。\n\n## 主体\n\n详细内容...`,
        wordCount: 800,
        sections: ['引言', '主体', '结论'],
        _mock: true
      },
      'image-gen': {
        success: true,
        images: ['https://picsum.photos/800/600?random=1'],
        prompt: input.prompt || '模拟图片',
        _mock: true
      },
      'content-review': {
        success: true,
        score: 85,
        level: 'pass',
        issues: { critical: [], warning: [], suggestion: [] },
        _mock: true
      },
      'xiaohongshu-publish': {
        success: true,
        postId: 'mock-post-123',
        url: 'https://www.xiaohongshu.com/explore/mock-post-123',
        publishedAt: new Date().toISOString(),
        _mock: true
      },
      'code-gen': {
        success: true,
        code: '// 模拟生成的代码\nconsole.log("Hello");',
        language: 'typescript',
        _mock: true
      },
      'test-gen': {
        success: true,
        tests: ['test.spec.ts'],
        coverage: 85,
        _mock: true
      }
    };
    
    return mocks[skillName] || {
      success: true,
      skill: skillName,
      message: `模拟执行: ${skillName}`,
      note: '配置 AI_API_KEY 启用真实执行',
      _mock: true
    };
  }

  /**
   * 带重试的执行
   */
  async executeSkillWithRetry(skill: Skill, input: Record<string, any>, context: Record<string, any> = {}): Promise<any> {
    let lastError: Error | null = null;
    const maxRetries = this.config.maxRetries || 3;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await this.executeSkill(skill, input, context);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Attempt ${i + 1} failed: ${error instanceof Error ? error.message : error}`);
        
        if (i < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
      }
    }
    
    throw lastError;
  }
}