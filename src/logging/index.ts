/**
 * 结构化日志系统
 * 支持多级别、多输出、格式化
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
}

export interface LoggerConfig {
  level: LogLevel;
  outputs: LogOutput[];
  format: 'json' | 'text' | 'pretty';
  includeTimestamp: boolean;
  includeContext: boolean;
}

export interface LogOutput {
  type: 'console' | 'file' | 'stream';
  level?: LogLevel;
  path?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

/**
 * 日志器
 */
export class Logger {
  private config: LoggerConfig;
  private context: Record<string, any> = {};
  private fileStream: fs.FileHandle | null = null;
  private currentFileSize = 0;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || 'info',
      outputs: config.outputs || [{ type: 'console' }],
      format: config.format || 'pretty',
      includeTimestamp: config.includeTimestamp ?? true,
      includeContext: config.includeContext ?? true
    };
  }

  /**
   * 创建子日志器（带上下文）
   */
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger(this.config);
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  /**
   * Debug 日志
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Info 日志
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Warn 日志
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Error 日志
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context: { ...this.context, ...context }
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    this.write(entry);
  }

  /**
   * Fatal 日志
   */
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'fatal',
      message,
      context: { ...this.context, ...context }
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    this.write(entry);
  }

  /**
   * 计时日志
   */
  time(label: string, context?: Record<string, any>): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.log('info', `${label} completed`, { ...context, duration });
    };
  }

  /**
   * 通用日志方法
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.config.includeContext ? { ...this.context, ...context } : undefined
    };

    this.write(entry);
  }

  /**
   * 写入日志
   */
  private async write(entry: LogEntry): Promise<void> {
    for (const output of this.config.outputs) {
      const outputLevel = output.level || this.config.level;
      if (LOG_LEVELS[entry.level] < LOG_LEVELS[outputLevel]) {
        continue;
      }

      const formatted = this.format(entry, output.type === 'console' ? this.config.format : 'json');

      switch (output.type) {
        case 'console':
          this.writeConsole(entry.level, formatted);
          break;
        case 'file':
          await this.writeFile(output, formatted);
          break;
      }
    }
  }

  /**
   * 写入控制台
   */
  private writeConsole(level: LogLevel, message: string): void {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m',  // cyan
      info: '\x1b[32m',   // green
      warn: '\x1b[33m',   // yellow
      error: '\x1b[31m',  // red
      fatal: '\x1b[35m'   // magenta
    };

    const reset = '\x1b[0m';
    const color = colors[level];
    
    // 简洁输出，不带颜色符号污染
    if (level === 'error' || level === 'fatal') {
      console.error(message);
    } else if (level === 'warn') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }

  /**
   * 写入文件
   */
  private async writeFile(output: LogOutput, message: string): Promise<void> {
    if (!output.path) return;

    try {
      // 检查文件大小限制
      if (output.maxFileSize && this.currentFileSize > output.maxFileSize) {
        await this.rotateFile(output);
      }

      await fs.appendFile(output.path, message + '\n');
      this.currentFileSize += message.length + 1;
    } catch (error) {
      console.error(`Failed to write log file: ${error}`);
    }
  }

  /**
   * 轮转日志文件
   */
  private async rotateFile(output: LogOutput): Promise<void> {
    if (!output.path) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedPath = `${output.path}.${timestamp}`;
    
    try {
      await fs.rename(output.path, rotatedPath);
      this.currentFileSize = 0;
    } catch (error) {
      // 文件可能不存在
    }
  }

  /**
   * 格式化日志
   */
  private format(entry: LogEntry, format: string): string {
    switch (format) {
      case 'json':
        return JSON.stringify(entry);
      
      case 'pretty':
        const levelStr = entry.level.toUpperCase().padEnd(5);
        const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
        const errorStr = entry.error ? `\n  Error: ${entry.error.message}` : '';
        return `${entry.timestamp} [${levelStr}] ${entry.message}${contextStr}${errorStr}`;
      
      default:
        return `[${entry.level}] ${entry.message}`;
    }
  }
}

// 全局日志实例
export const logger = new Logger({
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  outputs: [
    { type: 'console' },
    { type: 'file', path: './logs/agentwork.log', maxFileSize: 10 * 1024 * 1024 }
  ]
});