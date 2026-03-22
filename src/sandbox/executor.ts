/**
 * Sandbox 执行器
 * 使用 child_process 隔离执行代码和脚本
 */

import { spawn, ChildProcess } from 'child_process';
import { SandboxConfig, ExecutionResult } from './types';

/**
 * 沙箱执行器
 * 提供代码和脚本的安全隔离执行
 */
export class SandboxExecutor {
  private defaultTimeout = 30000; // 默认 30 秒超时

  /**
   * 执行代码
   * @param code 代码字符串
   * @param language 语言类型
   * @param config 沙箱配置
   */
  async executeCode(
    code: string,
    language: 'javascript' | 'python' | 'shell',
    config?: SandboxConfig
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeout = config?.timeout ?? this.defaultTimeout;

    let command: string;
    let args: string[];

    switch (language) {
      case 'javascript':
        command = 'node';
        args = ['-e', code];
        break;
      case 'python':
        command = 'python3';
        args = ['-c', code];
        break;
      case 'shell':
        command = '/bin/bash';
        args = ['-c', code];
        break;
      default:
        return {
          success: false,
          stdout: '',
          stderr: '',
          exitCode: -1,
          durationMs: 0,
          error: `Unsupported language: ${language}`,
        };
    }

    return this.runProcess(command, args, config, startTime, timeout);
  }

  /**
   * 执行脚本文件
   * @param script 脚本路径
   * @param args 参数
   * @param config 沙箱配置
   */
  async executeScript(
    script: string,
    args: string[] = [],
    config?: SandboxConfig
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeout = config?.timeout ?? this.defaultTimeout;

    // 根据脚本扩展名确定解释器
    let command: string;
    let scriptArgs: string[];

    if (script.endsWith('.js') || script.endsWith('.mjs')) {
      command = 'node';
      scriptArgs = [script, ...args];
    } else if (script.endsWith('.py')) {
      command = 'python3';
      scriptArgs = [script, ...args];
    } else if (script.endsWith('.sh') || script.endsWith('.bash')) {
      command = '/bin/bash';
      scriptArgs = [script, ...args];
    } else {
      // 默认尝试用 shell 执行
      command = '/bin/bash';
      scriptArgs = [script, ...args];
    }

    return this.runProcess(command, scriptArgs, config, startTime, timeout);
  }

  /**
   * 运行子进程
   */
  private runProcess(
    command: string,
    args: string[],
    config: SandboxConfig | undefined,
    startTime: number,
    timeout: number
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const options: {
        cwd?: string;
        env: NodeJS.ProcessEnv;
        timeout?: number;
      } = {
        env: { ...process.env, ...config?.env },
      };

      if (config?.cwd) {
        options.cwd = config.cwd;
      }

      let childProcess: ChildProcess;

      try {
        childProcess = spawn(command, args, options);
      } catch (err) {
        const durationMs = Date.now() - startTime;
        resolve({
          success: false,
          stdout: '',
          stderr: '',
          exitCode: -1,
          durationMs,
          error: `Failed to spawn process: ${err instanceof Error ? err.message : String(err)}`,
        });
        return;
      }

      // 超时控制
      const timeoutId = setTimeout(() => {
        timedOut = true;
        childProcess.kill('SIGKILL');
      }, timeout);

      // 收集输出
      childProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // 进程结束
      childProcess.on('close', (code: number | null) => {
        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;

        if (timedOut) {
          resolve({
            success: false,
            stdout,
            stderr: stderr + '\n[Process timed out]',
            exitCode: -1,
            durationMs,
            error: `Execution timed out after ${timeout}ms`,
          });
          return;
        }

        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code ?? -1,
          durationMs,
        });
      });

      // 进程错误
      childProcess.on('error', (err: Error) => {
        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;
        resolve({
          success: false,
          stdout,
          stderr,
          exitCode: -1,
          durationMs,
          error: err.message,
        });
      });
    });
  }
}