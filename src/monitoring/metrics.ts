/**
 * 监控指标系统
 * Prometheus 风格的 metrics 收集
 */

export interface MetricValue {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export interface MetricSummary {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
}

type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

interface MetricDefinition {
  name: string;
  type: MetricType;
  description: string;
  labels?: string[];
}

/**
 * 指标收集器
 */
export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private definitions: Map<string, MetricDefinition> = new Map();
  
  /**
   * 注册指标定义
   */
  register(definition: MetricDefinition): void {
    this.definitions.set(definition.name, definition);
    
    switch (definition.type) {
      case 'counter':
        this.counters.set(definition.name, 0);
        break;
      case 'gauge':
        this.gauges.set(definition.name, 0);
        break;
      case 'histogram':
      case 'summary':
        this.histograms.set(definition.name, []);
        break;
    }
  }
  
  /**
   * 增加计数器
   */
  increment(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    const key = this.getLabelKey(name, labels);
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }
  
  /**
   * 设置计量器
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.gauges.set(name, value);
  }
  
  /**
   * 记录直方图值
   */
  observe(name: string, value: number, labels: Record<string, string> = {}): void {
    const values = this.histograms.get(name) || [];
    values.push(value);
    this.histograms.set(name, values);
  }
  
  /**
   * 计时器辅助
   */
  startTimer(name: string, labels: Record<string, string> = {}): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.observe(name, duration, labels);
    };
  }
  
  /**
   * 获取计数器值
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }
  
  /**
   * 获取计量器值
   */
  getGauge(name: string): number {
    return this.gauges.get(name) || 0;
  }
  
  /**
   * 获取直方图摘要
   */
  getHistogramSummary(name: string): MetricSummary | null {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length
    };
  }
  
  /**
   * 获取百分位数
   */
  getPercentile(name: string, p: number): number | null {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
  
  /**
   * 导出为 Prometheus 格式
   */
  exportPrometheus(): string {
    const lines: string[] = [];
    
    for (const [name, def] of this.definitions) {
      lines.push(`# HELP ${name} ${def.description}`);
      lines.push(`# TYPE ${name} ${def.type}`);
      
      switch (def.type) {
        case 'counter':
          lines.push(`${name} ${this.counters.get(name) || 0}`);
          break;
        case 'gauge':
          lines.push(`${name} ${this.gauges.get(name) || 0}`);
          break;
        case 'histogram':
        case 'summary':
          const summary = this.getHistogramSummary(name);
          if (summary) {
            lines.push(`${name}_count ${summary.count}`);
            lines.push(`${name}_sum ${summary.sum}`);
            lines.push(`${name}_min ${summary.min}`);
            lines.push(`${name}_max ${summary.max}`);
            lines.push(`${name}_avg ${summary.avg.toFixed(2)}`);
            
            // 常用百分位数
            for (const p of [50, 90, 95, 99]) {
              const val = this.getPercentile(name, p);
              if (val !== null) {
                lines.push(`${name}_p${p} ${val}`);
              }
            }
          }
          break;
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * 导出为 JSON
   */
  exportJSON(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [name, def] of this.definitions) {
      switch (def.type) {
        case 'counter':
          result[name] = this.counters.get(name) || 0;
          break;
        case 'gauge':
          result[name] = this.gauges.get(name) || 0;
          break;
        case 'histogram':
        case 'summary':
          result[name] = this.getHistogramSummary(name);
          break;
      }
    }
    
    return result;
  }
  
  /**
   * 重置所有指标
   */
  reset(): void {
    for (const [name] of this.counters) {
      this.counters.set(name, 0);
    }
    for (const [name] of this.histograms) {
      this.histograms.set(name, []);
    }
  }
  
  /**
   * 获取带标签的 key
   */
  private getLabelKey(name: string, labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) return name;
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }
}

// 全局指标实例
export const globalMetrics = new MetricsCollector();

// 预定义常用指标
globalMetrics.register({
  name: 'agentwork_tasks_total',
  type: 'counter',
  description: 'Total number of tasks processed'
});

globalMetrics.register({
  name: 'agentwork_tasks_active',
  type: 'gauge',
  description: 'Number of currently active tasks'
});

globalMetrics.register({
  name: 'agentwork_skills_executed',
  type: 'counter',
  description: 'Total number of skill executions'
});

globalMetrics.register({
  name: 'agentwork_skill_duration_ms',
  type: 'histogram',
  description: 'Duration of skill executions in milliseconds'
});

globalMetrics.register({
  name: 'agentwork_ai_calls_total',
  type: 'counter',
  description: 'Total number of AI API calls'
});

globalMetrics.register({
  name: 'agentwork_ai_latency_ms',
  type: 'histogram',
  description: 'AI API call latency in milliseconds'
});

globalMetrics.register({
  name: 'agentwork_errors_total',
  type: 'counter',
  description: 'Total number of errors'
});

globalMetrics.register({
  name: 'agentwork_memory_entries',
  type: 'gauge',
  description: 'Number of entries in memory store'
});