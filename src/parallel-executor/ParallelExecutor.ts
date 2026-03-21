import type { TaskStep } from '../types.js';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';

export type StepExecutor = (step: TaskStep) => Promise<any>;

export class ParallelExecutor {
  private analyzer: DependencyAnalyzer;
  private maxConcurrency: number;

  constructor(maxConcurrency: number = 3) {
    this.analyzer = new DependencyAnalyzer();
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * 并行执行步骤
   */
  async executeSteps(
    steps: TaskStep[],
    executor: StepExecutor
  ): Promise<Map<string, { success: boolean; result?: any; error?: string }>> {
    const results = new Map<string, { success: boolean; result?: any; error?: string }>();
    const groups = this.analyzer.getParallelGroups(steps);

    for (const group of groups) {
      // 并行执行当前组的所有步骤
      const promises = group.map(async (step) => {
        try {
          const result = await executor(step);
          results.set(step.id, { success: true, result });
        } catch (error: any) {
          results.set(step.id, { success: false, error: error.message });
        }
      });

      await Promise.all(promises);

      // 检查是否有失败的步骤
      const failed = group.filter(s => results.get(s.id)?.success === false);
      if (failed.length > 0) {
        // 可以选择中断或继续
        // 这里选择继续执行
      }
    }

    return results;
  }

  /**
   * 获取执行计划
   */
  getExecutionPlan(steps: TaskStep[]): string {
    const groups = this.analyzer.analyzeSteps(steps);
    const lines = groups.map(g => 
      `Level ${g.level}: [${g.steps.map(s => s.id).join(', ')}]`
    );
    return lines.join('\n');
  }
}
