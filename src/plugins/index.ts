/**
 * 插件系统
 * 支持动态加载、生命周期钩子、依赖管理
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { Logger } from '../logging/index.js';
import { EventBus } from '../events/index.js';

export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  main: string;
  dependencies?: Record<string, string>;
  hooks?: PluginHook[];
  provides?: string[];
}

export interface PluginHook {
  event: string;
  handler: string;
  priority?: number;
}

export interface PluginContext {
  logger: Logger;
  events: EventBus;
  config: Record<string, any>;
  services: Map<string, any>;
}

export interface Plugin {
  manifest: PluginManifest;
  instance: any;
  context: PluginContext;
  enabled: boolean;
}

export type PluginState = 'loaded' | 'enabled' | 'disabled' | 'error';

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginDirs: string[];
  private logger: Logger;
  private events: EventBus;
  private services: Map<string, any> = new Map();
  private hooks: Map<string, Array<{ plugin: string; handler: Function; priority: number }>> = new Map();

  constructor(options: {
    pluginDirs?: string[];
    logger?: Logger;
    events?: EventBus;
  } = {}) {
    this.pluginDirs = options.pluginDirs || ['./plugins'];
    this.logger = options.logger || new Logger();
    this.events = options.events || new EventBus();
  }

  /**
   * 扫描并加载所有插件
   */
  async scanAndLoad(): Promise<void> {
    for (const dir of this.pluginDirs) {
      await this.scanDirectory(dir);
    }
  }

  /**
   * 扫描目录
   */
  private async scanDirectory(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const pluginPath = path.join(dir, entry.name);
        await this.loadPlugin(pluginPath);
      }
    } catch (error) {
      this.logger.warn(`Failed to scan plugin directory: ${dir}`);
    }
  }

  /**
   * 加载插件
   */
  async loadPlugin(pluginPath: string): Promise<Plugin | null> {
    try {
      // 读取 manifest
      const manifestPath = path.join(pluginPath, 'plugin.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);
      
      // 检查是否已加载
      if (this.plugins.has(manifest.name)) {
        this.logger.warn(`Plugin ${manifest.name} already loaded`);
        return this.plugins.get(manifest.name)!;
      }
      
      // 检查依赖
      if (manifest.dependencies) {
        for (const [dep, version] of Object.entries(manifest.dependencies)) {
          if (!this.plugins.has(dep)) {
            this.logger.warn(`Plugin ${manifest.name} depends on ${dep}, which is not loaded`);
          }
        }
      }
      
      // 创建插件上下文
      const context: PluginContext = {
        logger: this.logger.child({ plugin: manifest.name }),
        events: this.events,
        config: {},
        services: this.services
      };
      
      // 加载插件模块
      const mainPath = path.join(pluginPath, manifest.main);
      const module = await import(mainPath);
      const instance = module.default || module;
      
      const plugin: Plugin = {
        manifest,
        instance,
        context,
        enabled: false
      };
      
      this.plugins.set(manifest.name, plugin);
      this.logger.info(`Loaded plugin: ${manifest.name}@${manifest.version}`);
      
      return plugin;
    } catch (error: any) {
      this.logger.error(`Failed to load plugin from ${pluginPath}`, error);
      return null;
    }
  }

  /**
   * 启用插件
   */
  async enable(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      this.logger.warn(`Plugin ${name} not found`);
      return false;
    }
    
    if (plugin.enabled) {
      return true;
    }
    
    try {
      // 调用生命周期钩子
      if (typeof plugin.instance.onEnable === 'function') {
        await plugin.instance.onEnable(plugin.context);
      }
      
      // 注册事件钩子
      if (plugin.manifest.hooks) {
        for (const hook of plugin.manifest.hooks) {
          const handler = plugin.instance[hook.handler];
          if (typeof handler === 'function') {
            this.registerHook(hook.event, name, handler.bind(plugin.instance), hook.priority || 0);
          }
        }
      }
      
      plugin.enabled = true;
      this.logger.info(`Enabled plugin: ${name}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to enable plugin ${name}`, error);
      return false;
    }
  }

  /**
   * 禁用插件
   */
  async disable(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    
    if (!plugin.enabled) return true;
    
    try {
      // 调用生命周期钩子
      if (typeof plugin.instance.onDisable === 'function') {
        await plugin.instance.onDisable();
      }
      
      // 移除事件钩子
      for (const [event, handlers] of this.hooks) {
        this.hooks.set(event, handlers.filter(h => h.plugin !== name));
      }
      
      plugin.enabled = false;
      this.logger.info(`Disabled plugin: ${name}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to disable plugin ${name}`, error);
      return false;
    }
  }

  /**
   * 卸载插件
   */
  async unload(name: string): Promise<boolean> {
    await this.disable(name);
    return this.plugins.delete(name);
  }

  /**
   * 注册钩子
   */
  private registerHook(event: string, plugin: string, handler: Function, priority: number): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    
    this.hooks.get(event)!.push({ plugin, handler, priority });
    
    // 按优先级排序
    this.hooks.get(event)!.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 执行钩子
   */
  async executeHook(event: string, ...args: any[]): Promise<any[]> {
    const handlers = this.hooks.get(event) || [];
    const results: any[] = [];
    
    for (const { handler } of handlers) {
      try {
        const result = await handler(...args);
        results.push(result);
      } catch (error: any) {
        this.logger.error(`Hook error for ${event}`, error);
      }
    }
    
    return results;
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取插件状态
   */
  getState(name: string): PluginState {
    const plugin = this.plugins.get(name);
    if (!plugin) return 'disabled';
    if (plugin.enabled) return 'enabled';
    return 'loaded';
  }

  /**
   * 注册服务
   */
  registerService(name: string, service: any): void {
    this.services.set(name, service);
  }

  /**
   * 获取服务
   */
  getService<T = any>(name: string): T | undefined {
    return this.services.get(name);
  }
}

// 插件基类
export abstract class BasePlugin {
  abstract onEnable(context: PluginContext): Promise<void> | void;
  onDisable?(): Promise<void> | void;
  onError?(error: Error): Promise<void> | void;
}