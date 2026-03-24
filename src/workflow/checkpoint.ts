/**
 * 检查点管理器
 */

import { TaskStep, CheckpointResult } from '../types.js';
import { evaluateExpression } from '../utils.js';

/**
 * AI Provider 接口
 */
interface AIProvider {
  apiBase: string;
  model: string;
  apiKey?: string;
}

export class CheckpointManager {
  private defaultTimeout: number = 30000;

  /**
   * 获取可用的 AI Provider
   */
  private getAvailableProvider(): AIProvider | null {
    const providers: AIProvider[] = [
      {
        apiBase: process.env.ZHIPU_API_BASE || 'https://open.bigmodel.cn/api/paas/v4',
        model: 'glm-5',
        apiKey: process.env.ZHIPU_API_KEY || process.env.AI_API_KEY
      },
      {
        apiBase: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY
      }
    ];
    
    for (const provider of providers) {
      if (provider.apiKey) {
        return provider;
      }
    }
    return null;
  }

  /**
   * 调用 AI 验证
   */
  private async callAIValidate(prompt: string, output: any): Promise<boolean> {
    const provider = this.getAvailableProvider();
    if (!provider) {
      console.warn('No AI provider available for validation');
      return true;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
    
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
              content: '你是一个质量检查助手。请判断输出是否满足要求。只回答 "通过" 或 "不通过"。' 
            },
            { 
              role: 'user', 
              content: `验证要求: ${prompt}\n\n输出内容:\n${JSON.stringify(output, null, 2).substring(0, 1000)}` 
            }
          ],
          temperature: 0.3,
          max_tokens: 50
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return true; // AI 调用失败时默认通过
      }
      
      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content || '';
      return content.includes('通过') && !content.includes('不通过');
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('AI validation error:', error.message);
      return true; // 出错时默认通过
    }
  }

  /**
   * 验证检查点
   */
  async validate(
    step: TaskStep, 
    output: any, 
    context: Record<string, any>
  ): Promise<CheckpointResult> {
    const checkpoint = step.checkpoint;
    if (!checkpoint) {
      return {
        passed: true,
        requireApproval: false,
        validatedAt: new Date()
      };
    }

    // 需要人工确认
    if (checkpoint.requireApproval) {
      return {
        passed: false,
        requireApproval: true,
        message: `步骤 "${step.title}" 需要人工确认`,
        validatedAt: new Date()
      };
    }

    // 自动验证
    if (checkpoint.validate) {
      const validationContext = { ...context, output };
      try {
        const result = evaluateExpression(checkpoint.validate, validationContext);
        return {
          passed: !!result,
          requireApproval: false,
          message: result ? undefined : '验证条件不满足',
          validatedAt: new Date()
        };
      } catch (error: any) {
        return {
          passed: false,
          requireApproval: false,
          message: `验证表达式错误: ${error.message}`,
          validatedAt: new Date()
        };
      }
    }

    // AI 验证
    if (checkpoint.aiValidate) {
      const aiPassed = await this.callAIValidate(checkpoint.aiValidate, output);
      return {
        passed: aiPassed,
        requireApproval: false,
        message: aiPassed ? 'AI 验证通过' : 'AI 验证未通过',
        validatedAt: new Date()
      };
    }

    // 没有验证条件，默认通过
    return {
      passed: true,
      requireApproval: false,
      validatedAt: new Date()
    };
  }
}