/**
 * 错误处理与重试机制
 * 参考各框架的最佳实践
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;  // 初始延迟 (ms)
  maxDelay: number;      // 最大延迟 (ms)
  backoffFactor: number; // 退避因子
  retryableErrors?: string[]; // 可重试的错误类型
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableErrors: ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN']
};

/**
 * 带重试的异步执行
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  let attempts = 0;
  let totalDelayMs = 0;
  let delay = cfg.initialDelay;

  while (attempts <= cfg.maxRetries) {
    attempts++;
    
    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts,
        totalDelayMs
      };
    } catch (error: any) {
      lastError = error;
      
      // 检查是否可重试
      const errorCode = error.code || error.name || '';
      const isRetryable = cfg.retryableErrors?.some(e => 
        errorCode.includes(e) || error.message?.includes(e)
      );
      
      if (!isRetryable && attempts > 1) {
        // 不可重试的错误，直接返回
        break;
      }
      
      if (attempts <= cfg.maxRetries) {
        // 等待后重试
        await sleep(delay);
        totalDelayMs += delay;
        delay = Math.min(delay * cfg.backoffFactor, cfg.maxDelay);
      }
    }
  }

  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attempts,
    totalDelayMs
  };
}

/**
 * 电路断路器
 * 防止级联故障
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 60秒后尝试恢复
    private halfOpenMaxCalls: number = 3
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
  
  getState(): string {
    return this.state;
  }
  
  reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }
}

/**
 * 超时包装器
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  message = 'Operation timed out'
): Promise<T> {
  const controller = new AbortController();
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error(message));
    }, timeoutMs);
  });
  
  return Promise.race([fn(), timeoutPromise]);
}

/**
 * 批处理执行器
 * 控制并发数，支持重试
 */
export class BatchExecutor<T, R> {
  private circuitBreaker: CircuitBreaker;
  
  constructor(
    private concurrency: number = 5,
    private retryConfig: Partial<RetryConfig> = {}
  ) {
    this.circuitBreaker = new CircuitBreaker();
  }
  
  async execute(
    items: T[],
    fn: (item: T) => Promise<R>
  ): Promise<Map<T, RetryResult<R>>> {
    const results = new Map<T, RetryResult<R>>();
    const queue = [...items];
    const processing: Promise<void>[] = [];
    
    const processNext = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        
        const result = await retry(
          () => this.circuitBreaker.execute(() => fn(item)),
          this.retryConfig
        );
        results.set(item, result);
      }
    };
    
    // 启动并发处理
    for (let i = 0; i < Math.min(this.concurrency, items.length); i++) {
      processing.push(processNext());
    }
    
    await Promise.all(processing);
    return results;
  }
}

/**
 * 错误分类
 */
export function classifyError(error: Error): {
  type: 'network' | 'timeout' | 'validation' | 'permission' | 'resource' | 'unknown';
  retryable: boolean;
  message: string;
} {
  const message = error.message.toLowerCase();
  const code = (error as any).code?.toLowerCase() || '';
  
  // 网络错误
  if (['etimedout', 'econnreset', 'enotfound', 'eai_again'].includes(code) ||
      message.includes('network') || message.includes('connection')) {
    return { type: 'network', retryable: true, message: '网络连接问题' };
  }
  
  // 超时
  if (message.includes('timeout') || code === 'etimedout') {
    return { type: 'timeout', retryable: true, message: '操作超时' };
  }
  
  // 验证错误
  if (message.includes('invalid') || message.includes('validation')) {
    return { type: 'validation', retryable: false, message: '输入验证失败' };
  }
  
  // 权限错误
  if (message.includes('permission') || message.includes('unauthorized') || 
      message.includes('forbidden') || code === 'eacces') {
    return { type: 'permission', retryable: false, message: '权限不足' };
  }
  
  // 资源错误
  if (message.includes('not found') || message.includes('enoent') || 
      code === 'enoent') {
    return { type: 'resource', retryable: false, message: '资源不存在' };
  }
  
  return { type: 'unknown', retryable: true, message: '未知错误' };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}