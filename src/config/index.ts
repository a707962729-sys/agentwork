/**
 * 配置管理器
 * 支持多环境、环境变量覆盖、验证
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import { Logger } from '../logging/index.js';

export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: any;
    env?: string;  // 环境变量名
    validate?: (value: any) => boolean;
  };
}

export interface ConfigOptions {
  env?: string;
  configDir?: string;
  schema?: ConfigSchema;
}

/**
 * 配置管理器
 */
export class ConfigManager {
  private config: Record<string, any> = {};
  private schema: ConfigSchema;
  private env: string;
  private configDir: string;
  private watchers: Map<string, () => void> = new Map();
  private logger = new Logger();

  constructor(options: ConfigOptions = {}) {
    this.env = options.env || process.env.NODE_ENV || 'development';
    this.configDir = options.configDir || process.cwd();
    this.schema = options.schema || {};
  }

  /**
   * 加载配置
   */
  async load(name: string = 'config'): Promise<void> {
    // 加载顺序：默认配置 → 环境配置 → 本地配置 → 环境变量
    await this.loadFile(path.join(this.configDir, `${name}.yaml`));
    await this.loadFile(path.join(this.configDir, `${name}.${this.env}.yaml`));
    await this.loadFile(path.join(this.configDir, `${name}.local.yaml`));
    
    // 环境变量覆盖
    this.loadFromEnv();
    
    // 验证配置
    this.validate();
  }

  /**
   * 加载配置文件
   */
  private async loadFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = parseYaml(content);
      this.config = this.deepMerge(this.config, parsed);
    } catch (err) {
      // 文件不存在是正常的，其他错误需要记录
      if (err instanceof Error && 'ENOENT' in err) {
        this.logger.debug(`Config file not found: ${filePath}, skipping`);
      } else {
        this.logger.warn(`Failed to load config from ${filePath}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  /**
   * 从环境变量加载
   */
  private loadFromEnv(): void {
    for (const [key, schema] of Object.entries(this.schema)) {
      if (schema.env && process.env[schema.env]) {
        let value: any = process.env[schema.env];
        
        // 类型转换
        switch (schema.type) {
          case 'number':
            value = Number(value);
            break;
          case 'boolean':
            value = value === 'true' || value === '1';
            break;
          case 'object':
          case 'array':
            try {
              value = JSON.parse(value);
            } catch (err) {
              this.logger.warn(`Failed to parse env var ${schema.env} as ${schema.type}: ${err instanceof Error ? err.message : err}`);
            }
            break;
        }
        
        this.set(key, value);
      }
    }
  }

  /**
   * 获取配置值
   */
  get<T = any>(key: string, defaultValue?: T): T {
    const value = this.getNested(key);
    
    if (value === undefined) {
      const schema = this.schema[key];
      if (schema?.default !== undefined) {
        return schema.default as T;
      }
      return defaultValue as T;
    }
    
    return value as T;
  }

  /**
   * 获取嵌套值
   */
  private getNested(key: string): any {
    const parts = key.split('.');
    let value = this.config;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    
    return value;
  }

  /**
   * 设置配置值
   */
  set(key: string, value: any): void {
    const parts = key.split('.');
    let obj = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!obj[part]) {
        obj[part] = {};
      }
      obj = obj[part];
    }
    
    obj[parts[parts.length - 1]] = value;
  }

  /**
   * 验证配置
   */
  private validate(): void {
    for (const [key, schema] of Object.entries(this.schema)) {
      const value = this.get(key);
      
      if (schema.required && value === undefined) {
        throw new Error(`Config ${key} is required`);
      }
      
      if (value !== undefined && schema.validate && !schema.validate(value)) {
        throw new Error(`Config ${key} validation failed`);
      }
    }
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    if (!source) return target;
    if (!target) return source;
    
    const result = { ...target };
    
    for (const key of Object.keys(source)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * 获取所有配置
   */
  getAll(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * 导出为 JSON
   */
  toJSON(): string {
    return JSON.stringify(this.config, null, 2);
  }
}

// 默认配置 Schema
export const defaultConfigSchema: ConfigSchema = {
  'ai.default': {
    type: 'string',
    default: 'ollama',
    env: 'AI_PROVIDER'
  },
  'ai.timeout': {
    type: 'number',
    default: 120000,
    env: 'AI_TIMEOUT'
  },
  'execution.maxRetries': {
    type: 'number',
    default: 3
  },
  'execution.timeout': {
    type: 'number',
    default: 3600000
  },
  'logging.level': {
    type: 'string',
    default: 'info',
    env: 'LOG_LEVEL'
  },
  'database.path': {
    type: 'string',
    default: './data/agentwork.db'
  }
};

// 全局配置实例
export const config = new ConfigManager({ schema: defaultConfigSchema });