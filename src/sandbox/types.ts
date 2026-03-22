/**
 * Sandbox 类型定义
 * 代码隔离执行环境
 */

/**
 * 沙箱配置
 */
export interface SandboxConfig {
  /** 超时时间 (ms) */
  timeout?: number;
  
  /** 最大内存 (MB) */
  maxMemory?: number;
  
  /** 允许的网络访问 */
  networkAccess?: 'none' | 'restricted' | 'full';
  
  /** 允许的域名列表 (networkAccess = 'restricted' 时) */
  allowedDomains?: string[];
  
  /** 环境变量 */
  env?: Record<string, string>;
  
  /** 工作目录 */
  cwd?: string;
  
  /** 是否允许文件系统访问 */
  fsAccess?: boolean;
  
  /** 允许的路径 (fsAccess = true 时) */
  allowedPaths?: string[];
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  /** 是否成功 */
  success: boolean;
  
  /** 标准输出 */
  stdout: string;
  
  /** 标准错误 */
  stderr: string;
  
  /** 退出码 */
  exitCode: number;
  
  /** 执行时间 (ms) */
  durationMs: number;
  
  /** 使用的内存峰值 (MB) */
  peakMemoryMb?: number;
  
  /** 错误信息 */
  error?: string;
}

/**
 * 代码执行请求
 */
export interface CodeExecutionRequest {
  /** 代码 */
  code: string;
  
  /** 语言 */
  language: 'javascript' | 'typescript' | 'python' | 'shell' | 'bash';
  
  /** 沙箱配置 */
  config?: SandboxConfig;
  
  /** 输入数据 */
  input?: any;
}

/**
 * 脚本执行请求
 */
export interface ScriptExecutionRequest {
  /** 脚本路径 */
  script: string;
  
  /** 参数 */
  args?: string[];
  
  /** 沙箱配置 */
  config?: SandboxConfig;
}

/**
 * 隔离环境
 */
export interface IsolationEnvironment {
  /** 环境 ID */
  id: string;
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 状态 */
  status: 'idle' | 'running' | 'error';
  
  /** 配置 */
  config: SandboxConfig;
  
  /** 资源使用 */
  resources: {
    cpuMs: number;
    memoryMb: number;
    execCount: number;
  };
}