/**
 * 脚本执行器
 * 参考 DeerFlow 的统一脚本入口模式
 * 所有技能脚本使用统一的 CLI 接口
 */

import { SandboxExecutor, ExecutionResult } from '../sandbox/index.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ScriptOptions {
  /** 脚本路径（相对于技能目录） */
  script: string;
  /** 输入参数 */
  input: Record<string, any>;
  /** 输出文件路径 */
  outputFile?: string;
  /** 超时时间 */
  timeout?: number;
  /** 环境变量 */
  env?: Record<string, string>;
  /** 工作目录 */
  cwd?: string;
}

export interface ScriptResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
  stdout: string;
  stderr: string;
}

export class ScriptExecutor {
  private sandbox: SandboxExecutor;
  
  constructor() {
    this.sandbox = new SandboxExecutor();
  }

  /**
   * 执行技能脚本
   * 自动处理输入输出文件
   */
  async execute<T = any>(
    skillPath: string,
    options: ScriptOptions
  ): Promise<ScriptResult<T>> {
    const scriptPath = path.join(skillPath, 'scripts', options.script);
    
    // 检查脚本是否存在
    try {
      await fs.access(scriptPath);
    } catch {
      return {
        success: false,
        error: `Script not found: ${options.script}`,
        durationMs: 0,
        stdout: '',
        stderr: ''
      };
    }

    // 准备输入文件
    const inputFile = await this.prepareInputFile(options.input);
    const outputFile = options.outputFile || this.generateTempPath('output', '.json');

    // 构建参数
    const args = this.buildArgs(scriptPath, inputFile, outputFile, options);

    // 执行脚本
    const startTime = Date.now();
    const result = await this.sandbox.executeScript(scriptPath, args, {
      timeout: options.timeout || 60000,
      cwd: options.cwd || skillPath,
      env: options.env
    });
    const durationMs = Date.now() - startTime;

    // 清理输入文件
    await fs.unlink(inputFile).catch(() => {});

    // 处理结果
    if (!result.success) {
      return {
        success: false,
        error: result.error || result.stderr,
        durationMs,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    // 读取输出文件
    try {
      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const data = JSON.parse(outputContent);
      
      // 清理输出文件
      await fs.unlink(outputFile).catch(() => {});
      
      return {
        success: true,
        data,
        durationMs,
        stdout: result.stdout,
        stderr: result.stderr
      };
    } catch {
      // 没有输出文件，返回 stdout
      return {
        success: true,
        data: this.parseStdout(result.stdout) as T,
        durationMs,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }
  }

  /**
   * 执行 Python 脚本
   */
  async executePython(
    skillPath: string,
    script: string,
    input: Record<string, any>,
    options?: Partial<ScriptOptions>
  ): Promise<ScriptResult> {
    return this.execute(skillPath, {
      script,
      input,
      ...options
    });
  }

  /**
   * 执行 Node.js 脚本
   */
  async executeNode(
    skillPath: string,
    script: string,
    input: Record<string, any>,
    options?: Partial<ScriptOptions>
  ): Promise<ScriptResult> {
    return this.execute(skillPath, {
      script,
      input,
      ...options
    });
  }

  /**
   * 准备输入文件
   */
  private async prepareInputFile(input: Record<string, any>): Promise<string> {
    const inputFile = this.generateTempPath('input', '.json');
    await fs.writeFile(inputFile, JSON.stringify(input, null, 2), 'utf-8');
    return inputFile;
  }

  /**
   * 构建脚本参数
   */
  private buildArgs(
    scriptPath: string,
    inputFile: string,
    outputFile: string,
    options: ScriptOptions
  ): string[] {
    const args: string[] = [];
    
    // DeerFlow 风格的参数
    args.push('--input-file', inputFile);
    args.push('--output-file', outputFile);
    
    // 额外参数
    if (options.env) {
      for (const [key, value] of Object.entries(options.env)) {
        args.push('--env', `${key}=${value}`);
      }
    }
    
    return args;
  }

  /**
   * 解析 stdout 内容
   */
  private parseStdout(stdout: string): any {
    // 尝试解析 JSON
    try {
      return JSON.parse(stdout);
    } catch {}
    
    // 尝试提取 JSON 块
    const jsonMatch = stdout.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }
    
    // 返回原始文本
    return { output: stdout.trim() };
  }

  /**
   * 生成临时文件路径
   */
  private generateTempPath(prefix: string, ext: string): string {
    const random = Math.random().toString(36).slice(2);
    return `/tmp/${prefix}-${random}${ext}`;
  }
}