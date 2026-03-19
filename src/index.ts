/**
 * AgentWork - 一人公司自动化平台
 * 入口文件
 */

export { DatabaseManager } from './db/index.js';
export { WorkflowEngine } from './workflow/engine.js';
export { CheckpointManager } from './workflow/checkpoint.js';
export { SkillsRegistry } from './skills/index.js';
export { TaskOrchestrator } from './orchestrator/index.js';
export { MemoryManagerImpl, getMemoryManager } from './memory/index.js';
export * from './types.js';
export * from './utils.js';

import { DatabaseManager } from './db/index.js';
import { WorkflowEngine } from './workflow/engine.js';
import { SkillsRegistry } from './skills/index.js';
import { TaskOrchestrator } from './orchestrator/index.js';
import { expandHome, ensureDir } from './utils.js';
import { parse as parseYaml } from 'yaml';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AgentWorkConfig {
  workspace: string;
  skillsDir: string;
  workflowsDir: string;
  agentsDir: string;
  dbPath: string;
}

export class AgentWork {
  private config: AgentWorkConfig;
  private db!: DatabaseManager;
  private skills!: SkillsRegistry;
  private workflowEngine!: WorkflowEngine;
  private orchestrator!: TaskOrchestrator;

  constructor(config: Partial<AgentWorkConfig> = {}) {
    this.config = {
      workspace: config.workspace || '~/.agentwork',
      skillsDir: config.skillsDir || '~/.agentwork/skills',
      workflowsDir: config.workflowsDir || '~/.agentwork/workflows',
      agentsDir: config.agentsDir || '~/.agentwork/agents',
      dbPath: config.dbPath || '~/.agentwork/data/agentwork.db'
    };
  }

  /**
   * 初始化平台
   */
  async init(): Promise<void> {
    // 创建目录
    await ensureDir(expandHome(this.config.workspace));
    await ensureDir(expandHome(this.config.skillsDir));
    await ensureDir(expandHome(this.config.workflowsDir));
    await ensureDir(expandHome(this.config.agentsDir));
    await ensureDir(path.dirname(expandHome(this.config.dbPath)));

    // 初始化数据库
    this.db = new DatabaseManager(this.config.dbPath);

    // 初始化技能注册中心
    this.skills = new SkillsRegistry(this.db, this.config.skillsDir);
    await this.skills.init();

    // 初始化工作流引擎
    this.workflowEngine = new WorkflowEngine(this.db, this.skills);

    // 加载工作流定义
    await this.loadWorkflows();

    // 初始化任务编排器
    this.orchestrator = new TaskOrchestrator(this.db, this.workflowEngine, this.skills);
  }

  /**
   * 加载工作流定义
   */
  private async loadWorkflows(): Promise<void> {
    const workflowsDir = expandHome(this.config.workflowsDir);
    try {
      const files = await fs.readdir(workflowsDir);
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filepath = path.join(workflowsDir, file);
          await this.workflowEngine.loadFromFile(filepath);
        }
      }
    } catch {
      // 目录不存在
    }
  }

  /**
   * 获取任务编排器
   */
  getOrchestrator(): TaskOrchestrator {
    return this.orchestrator;
  }

  /**
   * 获取工作流引擎
   */
  getWorkflowEngine(): WorkflowEngine {
    return this.workflowEngine;
  }

  /**
   * 获取技能注册中心
   */
  getSkillsRegistry(): SkillsRegistry {
    return this.skills;
  }

  /**
   * 获取数据库
   */
  getDb(): DatabaseManager {
    return this.db;
  }

  /**
   * 关闭连接
   */
  close(): void {
    this.db.close();
  }
}

// 默认实例
let defaultInstance: AgentWork | null = null;

export async function getAgentWork(): Promise<AgentWork> {
  if (!defaultInstance) {
    defaultInstance = new AgentWork();
    await defaultInstance.init();
  }
  return defaultInstance;
}