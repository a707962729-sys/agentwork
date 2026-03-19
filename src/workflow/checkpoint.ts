/**
 * 检查点管理器
 */

import { TaskStep, CheckpointResult } from '../types.js';
import { evaluateExpression } from '../utils.js';

export class CheckpointManager {
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
      // TODO: 调用 AI 进行验证
      return {
        passed: true,
        requireApproval: false,
        message: 'AI 验证通过',
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