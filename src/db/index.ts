/**
 * 数据库模块 - SQLite 存储
 */

import Database from 'better-sqlite3';
import { Task, TaskStep, WorkflowRun, WorkflowDefinition, Skill, AgentConfig } from '../types.js';
import { v4 as uuid } from 'uuid';
import { expandHome } from '../utils.js';

export class DatabaseManager {
  public db: any;

  constructor(dbPath: string) {
    const expandedPath = expandHome(dbPath);
    this.db = new Database(expandedPath);
    this.init();
  }

  private init() {
    // 创建任务表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'custom',
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'normal',
        workflow_id TEXT,
        workflow_run_id TEXT,
        steps TEXT DEFAULT '[]',
        result TEXT,
        error TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        started_at TEXT,
        completed_at TEXT
      )
    `);

    // 创建工作流运行表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_runs (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        inputs TEXT DEFAULT '{}',
        steps TEXT DEFAULT '[]',
        current_step_id TEXT,
        outputs TEXT,
        error TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        started_at TEXT,
        completed_at TEXT
      )
    `);

    // 创建工作流定义表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        version TEXT DEFAULT '1.0.0',
        definition TEXT NOT NULL,
        installed_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建技能表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        manifest TEXT NOT NULL,
        content TEXT,
        installed_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建 Agent 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        config TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建模型配置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        model_id TEXT NOT NULL,
        type TEXT DEFAULT 'openai-compatible',
        base_url TEXT,
        api_key TEXT,
        is_default INTEGER DEFAULT 0,
        supports TEXT DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建模型路由规则表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS model_routing_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        agent_type TEXT,
        task_type TEXT,
        keywords TEXT DEFAULT '[]',
        model_id TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        priority INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 初始化默认模型配置
    this.initDefaultModels();
  }

  private initDefaultModels() {
    const stmt = this.db.prepare('SELECT id FROM models WHERE id = ?');
    const row = stmt.get('minimax-2.7');
    if (!row) {
      const insert = this.db.prepare(`
        INSERT INTO models (id, name, model_id, type, base_url, api_key, is_default, supports)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run('minimax-2.7', 'MiniMax 2.7', 'minimax-portal/MiniMax-M2.7', 'openai-compatible', 'https://api.minimaxi.chat', '', 1, JSON.stringify(['chat', 'function-calling', 'vision']));
    }

    // 初始化默认路由规则
    const ruleStmt = this.db.prepare('SELECT id FROM model_routing_rules WHERE id = ?');
    const defaultRules = [
      { id: 'rule-data', name: '数据处理类任务', agentType: '', taskType: 'data', keywords: '["数据", "分析", "报表", "统计"]', modelId: 'minimax-2.7' },
      { id: 'rule-content', name: '文案创作类任务', agentType: '', taskType: 'content', keywords: '["文案", "创作", "写作", "文章"]', modelId: 'minimax-2.7' },
      { id: 'rule-code', name: '代码生成类任务', agentType: '', taskType: 'code', keywords: '["代码", "编程", "开发", "函数"]', modelId: 'minimax-2.7' },
      { id: 'rule-default', name: '默认兜底', agentType: '', taskType: '', keywords: '[]', modelId: 'minimax-2.7' },
    ];
    for (const rule of defaultRules) {
      const existing = ruleStmt.get(rule.id);
      if (!existing) {
        const insertRule = this.db.prepare(`
          INSERT INTO model_routing_rules (id, name, agent_type, task_type, keywords, model_id, enabled, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const isDefault = rule.id === 'rule-default';
        insertRule.run(rule.id, rule.name, rule.agentType, rule.taskType, rule.keywords, rule.modelId, isDefault ? 1 : 0, isDefault ? 999 : 0);
      }
    }
  }

  // ==================== 任务操作 ====================

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const id = uuid();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, title, description, type, status, priority, workflow_id, workflow_run_id, steps, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      task.title,
      task.description,
      task.type,
      task.status,
      task.priority,
      task.workflowId,
      task.workflowRunId,
      JSON.stringify(task.steps),
      now,
      now
    );

    return { ...task, id, createdAt: new Date(now), updatedAt: new Date(now) };
  }

  getTask(id: string): Task | null {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      priority: row.priority,
      workflowId: row.workflow_id,
      workflowRunId: row.workflow_run_id,
      steps: JSON.parse(row.steps),
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    };
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const task = this.getTask(id);
    if (!task) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.steps !== undefined) {
      fields.push('steps = ?');
      values.push(JSON.stringify(updates.steps));
    }
    if (updates.result !== undefined) {
      fields.push('result = ?');
      values.push(JSON.stringify(updates.result));
    }
    if (updates.error !== undefined) {
      fields.push('error = ?');
      values.push(updates.error);
    }
    if (updates.startedAt !== undefined) {
      fields.push('started_at = ?');
      values.push(updates.startedAt.toISOString());
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt.toISOString());
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getTask(id);
  }

  listTasks(limit = 50): Task[] {
    const stmt = this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      priority: row.priority,
      workflowId: row.workflow_id,
      workflowRunId: row.workflow_run_id,
      steps: JSON.parse(row.steps),
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    }));
  }

  deleteTask(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ==================== 工作流操作 ====================

  saveWorkflow(workflow: WorkflowDefinition): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO workflows (id, name, description, version, definition)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      workflow.metadata.id,
      workflow.metadata.name,
      workflow.metadata.description,
      workflow.metadata.version,
      JSON.stringify(workflow)
    );
  }

  getWorkflow(id: string): WorkflowDefinition | null {
    const stmt = this.db.prepare('SELECT * FROM workflows WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;
    return JSON.parse(row.definition);
  }

  listWorkflows(): WorkflowDefinition[] {
    const stmt = this.db.prepare('SELECT * FROM workflows ORDER BY installed_at DESC');
    const rows = stmt.all() as any[];

    return rows.map(row => JSON.parse(row.definition));
  }

  // ==================== 工作流运行操作 ====================

  createWorkflowRun(run: Omit<WorkflowRun, 'id' | 'createdAt' | 'updatedAt'>): WorkflowRun {
    const id = uuid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO workflow_runs (id, workflow_id, status, inputs, steps, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      run.workflowId,
      run.status,
      JSON.stringify(run.inputs),
      JSON.stringify(run.steps),
      now,
      now
    );

    return { ...run, id, createdAt: new Date(now), updatedAt: new Date(now) };
  }

  getWorkflowRun(id: string): WorkflowRun | null {
    const stmt = this.db.prepare('SELECT * FROM workflow_runs WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      workflowId: row.workflow_id,
      status: row.status,
      inputs: JSON.parse(row.inputs),
      steps: JSON.parse(row.steps),
      currentStepId: row.current_step_id,
      outputs: row.outputs ? JSON.parse(row.outputs) : undefined,
      error: row.error,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    };
  }

  updateWorkflowRun(id: string, updates: Partial<WorkflowRun>): WorkflowRun | null {
    const run = this.getWorkflowRun(id);
    if (!run) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.steps !== undefined) {
      fields.push('steps = ?');
      values.push(JSON.stringify(updates.steps));
    }
    if (updates.currentStepId !== undefined) {
      fields.push('current_step_id = ?');
      values.push(updates.currentStepId);
    }
    if (updates.outputs !== undefined) {
      fields.push('outputs = ?');
      values.push(JSON.stringify(updates.outputs));
    }
    if (updates.error !== undefined) {
      fields.push('error = ?');
      values.push(updates.error);
    }
    if (updates.startedAt !== undefined) {
      fields.push('started_at = ?');
      values.push(updates.startedAt.toISOString());
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt.toISOString());
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`UPDATE workflow_runs SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getWorkflowRun(id);
  }

  // ==================== 技能操作 ====================

  saveSkill(skill: Skill): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO skills (id, name, path, manifest, content)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      skill.manifest.name,
      skill.manifest.name,
      skill.path,
      JSON.stringify(skill.manifest),
      skill.content
    );
  }

  getSkill(name: string): Skill | null {
    const stmt = this.db.prepare('SELECT * FROM skills WHERE name = ?');
    const row = stmt.get(name) as any;

    if (!row) return null;

    return {
      path: row.path,
      manifest: JSON.parse(row.manifest),
      content: row.content
    };
  }

  listSkills(): Skill[] {
    const stmt = this.db.prepare('SELECT * FROM skills');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      path: row.path,
      manifest: JSON.parse(row.manifest),
      content: row.content
    }));
  }

  // ==================== Agent 操作 ====================

  saveAgent(config: AgentConfig): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO agents (id, name, config)
      VALUES (?, ?, ?)
    `);

    stmt.run(config.id, config.name, JSON.stringify(config));
  }

  getAgent(id: string): AgentConfig | null {
    const stmt = this.db.prepare('SELECT * FROM agents WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return JSON.parse(row.config);
  }

  listAgents(): AgentConfig[] {
    const stmt = this.db.prepare('SELECT * FROM agents');
    const rows = stmt.all() as any[];

    return rows.map(row => JSON.parse(row.config));
  }

  // ==================== 模型配置操作 ====================

  createModel(model: {
    name: string
    modelId: string
    type?: string
    baseUrl?: string
    apiKey?: string
    isDefault?: boolean
    supports?: string[]
  }): any {
    const id = uuid();
    const now = new Date().toISOString();

    // 如果设为默认，先取消其他默认
    if (model.isDefault) {
      this.db.prepare('UPDATE models SET is_default = 0').run();
    }

    const stmt = this.db.prepare(`
      INSERT INTO models (id, name, model_id, type, base_url, api_key, is_default, supports, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, model.name, model.modelId, model.type || 'openai-compatible', model.baseUrl || '', model.apiKey || '', model.isDefault ? 1 : 0, JSON.stringify(model.supports || []), now, now);

    return this.getModel(id);
  }

  getModel(id: string): any | null {
    const stmt = this.db.prepare('SELECT * FROM models WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      modelId: row.model_id,
      type: row.type,
      baseUrl: row.base_url,
      apiKey: row.api_key,
      isDefault: !!row.is_default,
      supports: JSON.parse(row.supports),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  updateModel(id: string, updates: Partial<{
    name: string
    modelId: string
    type: string
    baseUrl: string
    apiKey: string
    isDefault: boolean
    supports: string[]
  }>): any | null {
    const model = this.getModel(id);
    if (!model) return null;

    // 如果设为默认，先取消其他默认
    if (updates.isDefault) {
      this.db.prepare('UPDATE models SET is_default = 0').run();
    }

    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [new Date().toISOString()];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.modelId !== undefined) { fields.push('model_id = ?'); values.push(updates.modelId); }
    if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
    if (updates.baseUrl !== undefined) { fields.push('base_url = ?'); values.push(updates.baseUrl); }
    if (updates.apiKey !== undefined) { fields.push('api_key = ?'); values.push(updates.apiKey); }
    if (updates.isDefault !== undefined) { fields.push('is_default = ?'); values.push(updates.isDefault ? 1 : 0); }
    if (updates.supports !== undefined) { fields.push('supports = ?'); values.push(JSON.stringify(updates.supports)); }

    values.push(id);
    const stmt = this.db.prepare(`UPDATE models SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getModel(id);
  }

  listModels(): any[] {
    const stmt = this.db.prepare('SELECT * FROM models ORDER BY is_default DESC, created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      modelId: row.model_id,
      type: row.type,
      baseUrl: row.base_url,
      apiKey: row.api_key,
      isDefault: !!row.is_default,
      supports: JSON.parse(row.supports),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  deleteModel(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM models WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ==================== 模型路由规则操作 ====================

  createModelRoutingRule(rule: {
    name: string
    agentType?: string
    taskType?: string
    keywords?: string[]
    modelId: string
    enabled?: boolean
  }): any {
    const id = uuid();
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO model_routing_rules (id, name, agent_type, task_type, keywords, model_id, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, rule.name, rule.agentType || '', rule.taskType || '', JSON.stringify(rule.keywords || []), rule.modelId, rule.enabled !== false ? 1 : 0, now, now);
    return this.getModelRoutingRule(id);
  }

  getModelRoutingRule(id: string): any | null {
    const stmt = this.db.prepare('SELECT * FROM model_routing_rules WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      agentType: row.agent_type,
      taskType: row.task_type,
      keywords: JSON.parse(row.keywords),
      modelId: row.model_id,
      enabled: !!row.enabled,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  updateModelRoutingRule(id: string, updates: Partial<{
    name: string
    agentType: string
    taskType: string
    keywords: string[]
    modelId: string
    enabled: boolean
    priority: number
  }>): any | null {
    const rule = this.getModelRoutingRule(id);
    if (!rule) return null;

    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [new Date().toISOString()];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.agentType !== undefined) { fields.push('agent_type = ?'); values.push(updates.agentType); }
    if (updates.taskType !== undefined) { fields.push('task_type = ?'); values.push(updates.taskType); }
    if (updates.keywords !== undefined) { fields.push('keywords = ?'); values.push(JSON.stringify(updates.keywords)); }
    if (updates.modelId !== undefined) { fields.push('model_id = ?'); values.push(updates.modelId); }
    if (updates.enabled !== undefined) { fields.push('enabled = ?'); values.push(updates.enabled ? 1 : 0); }
    if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }

    values.push(id);
    const stmt = this.db.prepare(`UPDATE model_routing_rules SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getModelRoutingRule(id);
  }

  listModelRoutingRules(): any[] {
    const stmt = this.db.prepare('SELECT * FROM model_routing_rules ORDER BY priority ASC, created_at ASC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      agentType: row.agent_type,
      taskType: row.task_type,
      keywords: JSON.parse(row.keywords),
      modelId: row.model_id,
      enabled: !!row.enabled,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  deleteModelRoutingRule(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM model_routing_rules WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  close(): void {
    this.db.close();
  }
}