/**
 * 工具函数
 */

import * as path from 'path';
import * as os from 'os';

/**
 * 展开 ~ 为用户主目录
 */
export function expandHome(filepath: string): string {
  if (filepath.startsWith('~')) {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

/**
 * 确保目录存在
 */
export async function ensureDir(dir: string): Promise<void> {
  const fs = await import('fs/promises');
  const expandedPath = expandHome(dir);
  await fs.mkdir(expandedPath, { recursive: true });
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 表达式求值（简单版）
 */
export function evaluateExpression(expr: string, context: Record<string, any>): any {
  // 如果不是字符串，直接返回
  if (typeof expr !== 'string') {
    return expr;
  }

  // 检查是否包含表达式
  const hasExpression = expr.includes('${');
  if (!hasExpression) {
    return expr;
  }

  // 支持 ${inputs.xxx} 和 ${steps.xxx.output} 格式
  let hasReplacement = false;
  const interpolated = expr.replace(/\$\{([^}]+)\}/g, (_, path) => {
    const parts = path.split('.');
    let value: any = context;
    
    for (const part of parts) {
      if (value === undefined || value === null) {
        return '${' + path + '}';  // 保持原样，不替换
      }
      value = value[part];
    }
    
    if (value === undefined || value === null) {
      return '${' + path + '}';  // 保持原样
    }
    
    hasReplacement = true;
    
    // 如果是对象或数组，返回 JSON 字符串
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  });

  // 如果整个表达式就是一个 ${...}，尝试返回原始值类型
  const singleExprMatch = expr.match(/^\$\{([^}]+)\}$/);
  if (singleExprMatch) {
    const path = singleExprMatch[1];
    const parts = path.split('.');
    let value: any = context;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    
    return value;  // 返回原始值（可能是对象、数组等）
  }

  return interpolated;
}

/**
 * 延迟
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}