/**
 * AgentWork Executor — 工具注册表
 * 自注册模式：工具通过 register() 动态注册
 */

import {
  ToolDefinition,
  ToolContext,
  ToolResult,
} from './types.js';
import { fileReadTool } from './built-in-tools/file-tool.js';
import { fileWriteTool } from './built-in-tools/file-write-tool.js';
import { bashTool } from './built-in-tools/bash-tool.js';
import { webSearchTool } from './built-in-tools/web-search-tool.js';

// ============ 全局工具注册表（供外部扩展）============

export class GlobalToolRegistry {
  private static instance = new Map<string, ToolDefinition>();

  static register(tool: ToolDefinition): void {
    this.instance.set(tool.id, tool);
  }

  static get(id: string): ToolDefinition | undefined {
    return this.instance.get(id);
  }

  static getAll(): ToolDefinition[] {
    return Array.from(this.instance.values());
  }

  static clear(): void {
    this.instance.clear();
  }
}

// ============ 工具注册表 ============

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  constructor() {
    this.registerBuiltins();
  }

  /**
   * 注册内置工具（4个核心工具）
   */
  private registerBuiltins(): void {
    this.register(fileReadTool);
    this.register(fileWriteTool);
    this.register(bashTool);
    this.register(webSearchTool);
  }

  /**
   * 初始化：注册内置工具 + 扫描全局注册表
   */
  async init(): Promise<void> {
    // 从全局注册表导入（供外部插件扩展）
    for (const tool of GlobalToolRegistry.getAll()) {
      this.register(tool);
    }
  }

  /**
   * 注册工具
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.id)) {
      console.warn(`[ToolRegistry] Tool ${tool.id} already registered, skipping`);
      return;
    }
    this.tools.set(tool.id, { ...tool, enabled: tool.enabled ?? true });
  }

  /**
   * 注销工具
   */
  unregister(id: string): void {
    this.tools.delete(id);
  }

  /**
   * 获取单个工具
   */
  getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  /**
   * 获取所有工具
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取已启用工具
   */
  getEnabledTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).filter((t) => t.enabled);
  }

  /**
   * 根据 ID 列表获取工具（用于 Agent 配置的 tools 字段）
   */
  getByIds(ids: string[]): ToolDefinition[] {
    return ids
      .map((id) => this.tools.get(id))
      .filter((t): t is ToolDefinition => t !== undefined && t.enabled);
  }

  /**
   * 执行工具
   */
  async execute(
    toolId: string,
    params: any,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolId);

    if (!tool) {
      return { success: false, error: `Tool '${toolId}' not found` };
    }

    if (!tool.enabled) {
      return { success: false, error: `Tool '${toolId}' is disabled` };
    }

    try {
      const result = await tool.handler(params, context);
      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
