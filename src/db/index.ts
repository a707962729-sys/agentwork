/**
 * 数据库模块 - SQLite 存储
 */

import Database from 'better-sqlite3';
import { Task, TaskStep, WorkflowRun, WorkflowDefinition, Skill, AgentConfig } from '../types.js';
import { v4 as uuid } from 'uuid';
import { expandHome } from '../utils.js';

export class DatabaseManager {
  private db: Database.Database;

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

  close(): void {
    this.db.close();
  }
}