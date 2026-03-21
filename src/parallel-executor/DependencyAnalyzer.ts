import type { TaskStep } from '../types.js';

export interface ExecutionGroup {
  steps: TaskStep[];
  level: number;
}

export class DependencyAnalyzer {
  /**
   * 分析步骤依赖，生成执行层级
   */
  analyzeSteps(steps: TaskStep[]): ExecutionGroup[] {
    const groups: ExecutionGroup[] = [];
    const completed = new Set<string>();
    const remaining = [...steps];

    let level = 0;
    while (remaining.length > 0) {
      // 找出所有依赖已满足的步骤
      const readySteps = remaining.filter(step => 
        step.dependsOn.every(dep => completed.has(dep))
      );

      if (readySteps.length === 0) {
        // 存在循环依赖，按顺序执行剩余步骤
        groups.push({ steps: remaining, level: level++ });
        break;
      }

      groups.push({ steps: readySteps, level: level++ });
      readySteps.forEach(step => {
        completed.add(step.id);
        const idx = remaining.findIndex(s => s.id === step.id);
        if (idx >= 0) remaining.splice(idx, 1);
      });
    }

    return groups;
  }

  /**
   * 获取可并行执行的步骤组
   */
  getParallelGroups(steps: TaskStep[]): TaskStep[][] {
    const groups = this.analyzeSteps(steps);
    return groups.map(g => g.steps);
  }

  /**
   * 检测循环依赖
   */
  detectCycle(steps: TaskStep[]): string[] | null {
    const visited = new Set<string>();
    const path: string[] = [];

    const visit = (stepId: string): string[] | null => {
      if (path.includes(stepId)) {
        return [...path.slice(path.indexOf(stepId)), stepId];
      }
      if (visited.has(stepId)) return null;

      visited.add(stepId);
      path.push(stepId);

      const step = steps.find(s => s.id === stepId);
      if (step) {
        for (const dep of step.dependsOn) {
          const cycle = visit(dep);
          if (cycle) return cycle;
        }
      }

      path.pop();
      return null;
    };

    for (const step of steps) {
      const cycle = visit(step.id);
      if (cycle) return cycle;
    }

    return null;
  }
}
