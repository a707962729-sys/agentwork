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
  // 支持 ${inputs.xxx} 和 ${steps.xxx.output} 格式
  const interpolated = expr.replace(/\$\{([^}]+)\}/g, (_, path) => {
    const parts = path.split('.');
    let value: any = context;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    
    return value;
  });

  // 如果是纯字符串插值，返回结果
  if (interpolated !== expr) {
    try {
      // 尝试解析为 JSON
      return JSON.parse(interpolated);
    } catch {
      return interpolated;
    }
  }

  // 尝试作为 JavaScript 表达式求值
  try {
    const fn = new Function(...Object.keys(context), `return ${expr}`);
    return fn(...Object.values(context));
  } catch {
    return expr;
  }
}

/**
 * 延迟
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}