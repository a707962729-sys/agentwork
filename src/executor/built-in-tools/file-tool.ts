/**
 * 内置工具：file_read
 * 读取文件内容
 */

import { readFile } from 'fs/promises';
import { ToolDefinition, ToolContext, ToolResult } from '../types.js';

interface FileReadParams {
  path: string;
  maxLines?: number;
}

export const fileReadTool: ToolDefinition = {
  id: 'executor_file_read',
  name: 'file_read',
  description: '读取文件内容。返回文件文本内容。',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文件路径',
      },
      maxLines: {
        type: 'number',
        description: '最多读取行数（省略则读取全部）',
      },
    },
    required: ['path'],
  },
  enabled: true,
  async handler(params: FileReadParams, _context: ToolContext): Promise<ToolResult> {
    try {
      const { path, maxLines } = params;

      const content = await readFile(path, 'utf-8');
      const lines = content.split('\n');
      const totalLines = lines.length;

      const output = maxLines ? lines.slice(0, maxLines).join('\n') : content;
      const suffix =
        maxLines && totalLines > maxLines
          ? `\n... (${totalLines - maxLines} more lines)`
          : '';

      return {
        success: true,
        output: output + suffix,
        metadata: { path, totalLines, readLines: maxLines ?? totalLines },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
