/**
 * Function Calling 工具定义
 */

import type { Tool } from './types';

/**
 * 预定义工具集合
 */
export const predefinedTools: Record<string, Tool> = {
  /**
   * 搜索工具
   */
  search: {
    type: 'function',
    function: {
      name: 'search',
      description: 'Search the web for information',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          limit: {
            type: 'number',
            description: 'Number of results (default: 5)',
          },
        },
        required: ['query'],
      },
    },
  },

  /**
   * 文件读取工具
   */
  readFile: {
    type: 'function',
    function: {
      name: 'readFile',
      description: 'Read contents of a file',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path to read',
          },
        },
        required: ['path'],
      },
    },
  },

  /**
   * 文件写入工具
   */
  writeFile: {
    type: 'function',
    function: {
      name: 'writeFile',
      description: 'Write content to a file',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path to write',
          },
          content: {
            type: 'string',
            description: 'Content to write',
          },
        },
        required: ['path', 'content'],
      },
    },
  },

  /**
   * 命令行执行工具
   */
  exec: {
    type: 'function',
    function: {
      name: 'exec',
      description: 'Execute a shell command',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Shell command to execute',
          },
          workdir: {
            type: 'string',
            description: 'Working directory',
          },
        },
        required: ['command'],
      },
    },
  },

  /**
   * 数据库查询工具
   */
  queryDatabase: {
    type: 'function',
    function: {
      name: 'queryDatabase',
      description: 'Query a database',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'SQL query',
          },
          database: {
            type: 'string',
            description: 'Database name',
          },
        },
        required: ['query'],
      },
    },
  },

  /**
   * HTTP 请求工具
   */
  httpRequest: {
    type: 'function',
    function: {
      name: 'httpRequest',
      description: 'Make an HTTP request',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to request',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            description: 'HTTP method',
          },
          headers: {
            type: 'object',
            description: 'Request headers',
          },
          body: {
            type: 'string',
            description: 'Request body',
          },
        },
        required: ['url', 'method'],
      },
    },
  },
};

/**
 * 创建自定义工具
 */
export function createTool(
  name: string,
  description: string,
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: any[];
    }>;
    required?: string[];
  }
): Tool {
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters,
    },
  };
}

/**
 * 从函数创建工具
 */
export function toolFromFunction<T extends any[]>(
  name: string,
  description: string,
  paramsSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: any[];
    }>;
    required?: string[];
  },
  handler: (...args: T) => Promise<any>
): Tool & { handler: (...args: T) => Promise<any> } {
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters: paramsSchema,
    },
    handler,
  };
}
