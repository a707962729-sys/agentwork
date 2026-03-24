/**
 * 内置工具：bash
 * 执行 shell 命令
 */

import { execSync } from 'child_process';
import { ToolDefinition, ToolContext, ToolResult } from '../types.js';

// ============ 危险命令黑名单 ============

const DANGEROUS_PATTERNS = [
  /\brsync\b/,
  /\bmkfs\b/,
  /\bdd\b.*of=/,
  /\brm\s+-rf\s+\//,
  /\b:(){:|:&};:/,  // fork bomb
  /\bcurl\b.*\|\s*sh\b/,  // curl|sh
  /\bwget\b.*\|\s*sh\b/,  // wget|sh
];

const BLOCKED_COMMANDS = [
  'sudo',
  'su',
  'passwd',
  'chpasswd',
  'mkfs',
  'fsck',
  'dd',
  'fdisk',
  'parted',
  'lvremove',
  'lvcreate',
  'vgremove',
  'pvremove',
];

function isDangerous(command: string): string | null {
  const trimmed = command.trim().toLowerCase();

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return `危险命令匹配: ${pattern}`;
    }
  }

  for (const blocked of BLOCKED_COMMANDS) {
    if (trimmed.startsWith(blocked)) {
      return `禁止执行的命令: ${blocked}`;
    }
  }

  return null;
}

interface BashParams {
  command: string;
  timeout?: number; // 默认 30 秒
  cwd?: string;
}

export const bashTool: ToolDefinition = {
  id: 'executor_bash',
  name: 'bash',
  description: '在服务器上执行 shell 命令。返回 stdout/stderr。有超时保护。',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: '要执行的 shell 命令',
      },
      timeout: {
        type: 'number',
        description: '超时时间（秒），默认 30',
      },
      cwd: {
        type: 'string',
        description: '工作目录（可选）',
      },
    },
    required: ['command'],
  },
  enabled: true,
  async handler(params: BashParams, _context: ToolContext): Promise<ToolResult> {
    const { command, timeout = 30, cwd } = params;

    // 危险命令检查
    const dangerReason = isDangerous(command);
    if (dangerReason) {
      return {
        success: false,
        error: `[安全拦截] ${dangerReason}`,
      };
    }

    // 超时限制
    const timeoutMs = Math.min(Math.max(timeout, 1), 120) * 1000;

    try {
      const start = Date.now();
      const stdout = execSync(command, {
        encoding: 'utf-8',
        timeout: timeoutMs,
        cwd: cwd ?? process.cwd(),
        // 不允许 stderr → 合并到 stdout
        stdio: ['ignore', 'pipe', 'pipe'],
        // 限制输出大小 1MB
        maxBuffer: 1024 * 1024,
      });
      const elapsed = Date.now() - start;

      return {
        success: true,
        output: stdout.trim() || '(无输出)',
        metadata: {
          command,
          elapsedMs: elapsed,
          exitCode: 0,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message ?? String(err),
        metadata: {
          command,
          exitCode: err.status ?? 1,
          signal: err.signal ?? undefined,
        },
      };
    }
  },
};
