/**
 * AgentWork Executor — SQLite 持久化层
 * 使用 better-sqlite3（同步 API）
 */

import Database, { Statement } from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import {
  AgentConfig,
  Task,
  Session,
  Message,
  ScheduledTask,
  WorkAsset,
  TaskStatus,
  TaskPriority,
  TaskInput,
  TaskOutput,
  SessionContext,
  ExecutorState,
  ToolCall,
  Attachment,
} from './types.js';

// ============ Schema ============

const SCHEMA = `
-- Agent 配置表
CREATE TABLE IF NOT EXISTS executor_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  model_type TEXT NOT NULL DEFAULT 'openai',
  api_key TEXT,
  base_url TEXT,
  max_tokens INTEGER DEFAULT 4096,
  temperature REAL DEFAULT 0.7,
  system_prompt TEXT,
  tools TEXT DEFAULT '[]',
  skills TEXT DEFAULT '[]',
  experience_id TEXT,
  concurrent_limit INTEGER DEFAULT 3,
  status TEXT DEFAULT 'idle',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 任务表
CREATE TABLE IF NOT EXISTS executor_tasks (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  session_id TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  input TEXT NOT NULL,
  output TEXT,
  result TEXT,
  error TEXT,
  progress INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES executor_agents(id)
);

-- 会话表
CREATE TABLE IF NOT EXISTS executor_sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  task_id TEXT,
  status TEXT DEFAULT 'active',
  context TEXT DEFAULT '{}',
  message_count INTEGER DEFAULT 0,
  last_message_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES executor_agents(id)
);

-- 消息表
CREATE TABLE IF NOT EXISTS executor_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  name TEXT,
  tool_call_id TEXT,
  attachments TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES executor_sessions(id)
);

-- 定时任务表
CREATE TABLE IF NOT EXISTS executor_scheduled_tasks (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  task_template TEXT NOT NULL,
  cron TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  last_run_at TEXT,
  next_run_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES executor_agents(id)
);

-- 成果资产表
CREATE TABLE IF NOT EXISTS executor_work_assets (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  session_id TEXT,
  agent_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  size INTEGER,
  mime_type TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES executor_tasks(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_exec_tasks_status ON executor_tasks(status);
CREATE INDEX IF NOT EXISTS idx_exec_tasks_agent ON executor_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_exec_tasks_scheduled ON executor_tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_exec_messages_session ON executor_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_exec_sessions_agent ON executor_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_exec_assets_task ON executor_work_assets(task_id);
`;

// ============ 默认 DB 路径 ============

const DEFAULT_DB_PATH = join(process.env.HOME ?? '/tmp', '.agentwork', 'executor.db');

// ============ ExecutorDB 类 ============

export class ExecutorDB {
  private db: Database;

  constructor(dbPath: string = DEFAULT_DB_PATH) {
    // 确保目录存在
    mkdirSync(dirname(dbPath), { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.exec(SCHEMA);
  }

  getDatabase(): Database {
    return this.db;
  }

  // ==================== Agent CRUD ====================

  getAgent(id: string): AgentConfig | undefined {
    const row = this.db
      .prepare('SELECT * FROM executor_agents WHERE id = ?')
      .get(id) as any;
    return row ? this.rowToAgent(row) : undefined;
  }

  listAgents(): AgentConfig[] {
    const rows = this.db
      .prepare('SELECT * FROM executor_agents ORDER BY created_at DESC')
      .all() as any[];
    return rows.map((r) => this.rowToAgent(r));
  }

  createAgent(agent: AgentConfig): void {
    this.db
      .prepare(
        `INSERT INTO executor_agents
          (id, name, description, model, model_type, api_key, base_url,
           max_tokens, temperature, system_prompt, tools, skills,
           experience_id, concurrent_limit, status, created_at, updated_at)
         VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        agent.id,
        agent.name,
        agent.description,
        agent.model,
        agent.modelType,
        agent.apiKey ?? null,
        agent.baseUrl ?? null,
        agent.maxTokens ?? 4096,
        agent.temperature ?? 0.7,
        agent.systemPrompt ?? null,
        JSON.stringify(agent.tools),
        JSON.stringify(agent.skills),
        agent.experienceId ?? null,
        agent.concurrentLimit ?? 3,
        agent.status ?? 'idle',
        agent.createdAt ?? new Date().toISOString(),
        agent.updatedAt ?? new Date().toISOString()
      );
  }

  updateAgent(id: string, updates: Partial<AgentConfig>): void {
    const fields: string[] = [];
    const values: any[] = [];

    const map: Record<string, string> = {
      name: 'name',
      description: 'description',
      model: 'model',
      modelType: 'model_type',
      apiKey: 'api_key',
      baseUrl: 'base_url',
      maxTokens: 'max_tokens',
      temperature: 'temperature',
      systemPrompt: 'system_prompt',
      tools: 'tools',
      skills: 'skills',
      experienceId: 'experience_id',
      concurrentLimit: 'concurrent_limit',
      status: 'status',
    };

    for (const [key, col] of Object.entries(map)) {
      if (key in updates) {
        fields.push(`${col} = ?`);
        const val = updates[key as keyof AgentConfig];
        values.push(Array.isArray(val) ? JSON.stringify(val) : val);
      }
    }

    if (fields.length === 0) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);

    this.db
      .prepare(`UPDATE executor_agents SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values);
  }

  deleteAgent(id: string): void {
    this.db.prepare('DELETE FROM executor_agents WHERE id = ?').run(id);
  }

  private rowToAgent(row: any): AgentConfig {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      model: row.model,
      modelType: row.model_type,
      apiKey: row.api_key ?? undefined,
      baseUrl: row.base_url ?? undefined,
      maxTokens: row.max_tokens ?? 4096,
      temperature: row.temperature ?? 0.7,
      systemPrompt: row.system_prompt ?? undefined,
      tools: JSON.parse(row.tools ?? '[]'),
      skills: JSON.parse(row.skills ?? '[]'),
      experienceId: row.experience_id ?? undefined,
      concurrentLimit: row.concurrent_limit ?? 3,
      status: row.status ?? 'idle',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ==================== Task CRUD ====================

  getTask(id: string): Task | undefined {
    const row = this.db
      .prepare('SELECT * FROM executor_tasks WHERE id = ?')
      .get(id) as any;
    return row ? this.rowToTask(row) : undefined;
  }

  listTasks(filter?: { status?: TaskStatus; agentId?: string }): Task[] {
    let sql = 'SELECT * FROM executor_tasks WHERE 1=1';
    const params: any[] = [];

    if (filter?.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter?.agentId) {
      sql += ' AND agent_id = ?';
      params.push(filter.agentId);
    }
    sql += ' ORDER BY created_at ASC';

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((r) => this.rowToTask(r));
  }

  createTask(task: Task): void {
    this.db
      .prepare(
        `INSERT INTO executor_tasks
          (id, agent_id, session_id, status, priority, input, output,
           result, error, progress, retry_count, max_retries,
           scheduled_at, started_at, completed_at, created_at, updated_at)
         VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        task.id,
        task.agentId,
        task.sessionId ?? null,
        task.status,
        task.priority ?? 'normal',
        JSON.stringify(task.input),
        task.output ? JSON.stringify(task.output) : null,
        task.result !== undefined ? JSON.stringify(task.result) : null,
        task.error ?? null,
        task.progress ?? 0,
        task.retryCount ?? 0,
        task.maxRetries ?? 3,
        task.scheduledAt ?? null,
        task.startedAt ?? null,
        task.completedAt ?? null,
        task.createdAt ?? new Date().toISOString(),
        task.updatedAt ?? new Date().toISOString()
      );
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const fields: string[] = [];
    const values: any[] = [];

    const map: Record<string, string> = {
      status: 'status',
      priority: 'priority',
      sessionId: 'session_id',
      output: 'output',
      result: 'result',
      error: 'error',
      progress: 'progress',
      retryCount: 'retry_count',
      scheduledAt: 'scheduled_at',
      startedAt: 'started_at',
      completedAt: 'completed_at',
    };

    for (const [key, col] of Object.entries(map)) {
      if (key in updates) {
        fields.push(`${col} = ?`);
        const val = (updates as any)[key];
        values.push(
          val !== undefined && val !== null
            ? JSON.stringify(val)
            : null
        );
      }
    }

    if (fields.length === 0) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);

    this.db
      .prepare(`UPDATE executor_tasks SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values);
  }

  /**
   * 原子操作：认领一个 pending 任务（按优先级+创建时间）
   */
  claimTask(agentId: string): Task | undefined {
    const now = new Date().toISOString();

    // 先查一个 pending 任务
    const row = this.db
      .prepare(
        `SELECT * FROM executor_tasks
          WHERE status = 'pending'
          ORDER BY
            CASE priority
              WHEN 'urgent' THEN 0
              WHEN 'high'   THEN 1
              WHEN 'normal' THEN 2
              WHEN 'low'    THEN 3
            END,
            created_at ASC
          LIMIT 1`
      )
      .get() as any;

    if (!row) return undefined;

    // 更新为 running
    this.db
      .prepare(
        `UPDATE executor_tasks
          SET status = 'running',
              started_at = ?,
              updated_at = datetime('now')
          WHERE id = ? AND status = 'pending'`
      )
      .run(now, row.id);

    return this.rowToTask({ ...row, status: 'running', started_at: now });
  }

  pollPendingTasks(limit: number = 10): Task[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM executor_tasks
          WHERE status = 'pending'
          ORDER BY
            CASE priority
              WHEN 'urgent' THEN 0
              WHEN 'high'   THEN 1
              WHEN 'normal' THEN 2
              WHEN 'low'    THEN 3
            END,
            created_at ASC
          LIMIT ?`
      )
      .all(limit) as any[];
    return rows.map((r) => this.rowToTask(r));
  }

  private rowToTask(row: any): Task {
    return {
      id: row.id,
      agentId: row.agent_id,
      sessionId: row.session_id ?? undefined,
      status: row.status as TaskStatus,
      priority: (row.priority as TaskPriority) ?? 'normal',
      input: JSON.parse(row.input),
      output: row.output ? JSON.parse(row.output) : undefined,
      result: row.result !== null ? JSON.parse(row.result) : undefined,
      error: row.error ?? undefined,
      progress: row.progress ?? 0,
      retryCount: row.retry_count ?? 0,
      maxRetries: row.max_retries ?? 3,
      scheduledAt: row.scheduled_at ?? undefined,
      startedAt: row.started_at ?? undefined,
      completedAt: row.completed_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ==================== Session CRUD ====================

  getSession(id: string): Session | undefined {
    const row = this.db
      .prepare('SELECT * FROM executor_sessions WHERE id = ?')
      .get(id) as any;
    return row ? this.rowToSession(row) : undefined;
  }

  createSession(session: Session): void {
    this.db
      .prepare(
        `INSERT INTO executor_sessions
          (id, agent_id, task_id, status, context, message_count,
           last_message_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        session.id,
        session.agentId,
        session.taskId ?? null,
        session.status,
        JSON.stringify(session.context),
        session.messageCount ?? 0,
        session.lastMessageAt ?? null,
        session.createdAt ?? new Date().toISOString(),
        session.updatedAt ?? new Date().toISOString()
      );
  }

  updateSession(id: string, updates: Partial<Session>): void {
    const fields: string[] = [];
    const values: any[] = [];

    const map: Record<string, string> = {
      status: 'status',
      taskId: 'task_id',
      context: 'context',
      messageCount: 'message_count',
      lastMessageAt: 'last_message_at',
    };

    for (const [key, col] of Object.entries(map)) {
      if (key in updates) {
        fields.push(`${col} = ?`);
        const val = (updates as any)[key];
        values.push(
          key === 'context' ? JSON.stringify(val) : val
        );
      }
    }

    if (fields.length === 0) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);

    this.db
      .prepare(
        `UPDATE executor_sessions SET ${fields.join(', ')} WHERE id = ?`
      )
      .run(...values);
  }

  private rowToSession(row: any): Session {
    const context: SessionContext = JSON.parse(row.context ?? '{}');
    // 填充默认值
    if (!context.recentMessages) context.recentMessages = [];
    if (!context.toolHistory) context.toolHistory = [];
    if (!context.variables) context.variables = {};

    return {
      id: row.id,
      agentId: row.agent_id,
      taskId: row.task_id ?? undefined,
      status: row.status as 'active' | 'archived',
      context,
      messageCount: row.message_count ?? 0,
      lastMessageAt: row.last_message_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ==================== Message CRUD ====================

  getMessages(sessionId: string, limit?: number): Message[] {
    let sql = 'SELECT * FROM executor_messages WHERE session_id = ? ORDER BY created_at ASC';
    const params: any[] = [sessionId];
    if (limit !== undefined) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((r) => this.rowToMessage(r));
  }

  createMessage(message: Message): void {
    this.db
      .prepare(
        `INSERT INTO executor_messages
          (id, session_id, role, content, name, tool_call_id,
           attachments, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        message.id,
        message.sessionId,
        message.role,
        message.content,
        message.name ?? null,
        message.toolCallId ?? null,
        message.attachments ? JSON.stringify(message.attachments) : null,
        message.metadata ? JSON.stringify(message.metadata) : null,
        message.createdAt ?? new Date().toISOString()
      );

    // 更新会话计数
    this.db
      .prepare(
        `UPDATE executor_sessions
          SET message_count = message_count + 1,
              last_message_at = datetime('now'),
              updated_at = datetime('now')
          WHERE id = ?`
      )
      .run(message.sessionId);
  }

  private rowToMessage(row: any): Message {
    return {
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      name: row.name ?? undefined,
      toolCallId: row.tool_call_id ?? undefined,
      attachments: row.attachments ? JSON.parse(row.attachments) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
    };
  }

  // ==================== ScheduledTask CRUD ====================

  getDueScheduledTasks(): ScheduledTask[] {
    const now = new Date().toISOString();
    const rows = this.db
      .prepare(
        `SELECT * FROM executor_scheduled_tasks
          WHERE enabled = 1 AND (next_run_at IS NULL OR next_run_at <= ?)
          ORDER BY next_run_at ASC`
      )
      .all(now) as any[];
    return rows.map((r) => this.rowToScheduledTask(r));
  }

  updateScheduledTask(id: string, updates: Partial<ScheduledTask>): void {
    const fields: string[] = [];
    const values: any[] = [];

    const map: Record<string, string> = {
      taskTemplate: 'task_template',
      cron: 'cron',
      enabled: 'enabled',
      lastRunAt: 'last_run_at',
      nextRunAt: 'next_run_at',
    };

    for (const [key, col] of Object.entries(map)) {
      if (key in updates) {
        fields.push(`${col} = ?`);
        const val = (updates as any)[key];
        values.push(
          key === 'taskTemplate' ? JSON.stringify(val) : val
        );
      }
    }

    if (fields.length === 0) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);

    this.db
      .prepare(
        `UPDATE executor_scheduled_tasks SET ${fields.join(', ')} WHERE id = ?`
      )
      .run(...values);
  }

  createScheduledTask(st: ScheduledTask): void {
    this.db
      .prepare(
        `INSERT INTO executor_scheduled_tasks
          (id, agent_id, task_template, cron, enabled,
           last_run_at, next_run_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        st.id,
        st.agentId,
        JSON.stringify(st.taskTemplate),
        st.cron,
        st.enabled ? 1 : 0,
        st.lastRunAt ?? null,
        st.nextRunAt ?? null,
        st.createdAt ?? new Date().toISOString(),
        st.updatedAt ?? new Date().toISOString()
      );
  }

  private rowToScheduledTask(row: any): ScheduledTask {
    return {
      id: row.id,
      agentId: row.agent_id,
      taskTemplate: JSON.parse(row.task_template),
      cron: row.cron,
      enabled: Boolean(row.enabled),
      lastRunAt: row.last_run_at ?? undefined,
      nextRunAt: row.next_run_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ==================== Asset CRUD ====================

  createAsset(asset: WorkAsset): void {
    this.db
      .prepare(
        `INSERT INTO executor_work_assets
          (id, task_id, session_id, agent_id, type, name, path,
           size, mime_type, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        asset.id,
        asset.taskId,
        asset.sessionId ?? null,
        asset.agentId,
        asset.type,
        asset.name,
        asset.path,
        asset.size ?? null,
        asset.mimeType ?? null,
        asset.metadata ? JSON.stringify(asset.metadata) : null,
        asset.createdAt ?? new Date().toISOString()
      );
  }

  getAssetsByTask(taskId: string): WorkAsset[] {
    const rows = this.db
      .prepare('SELECT * FROM executor_work_assets WHERE task_id = ?')
      .all(taskId) as any[];
    return rows.map((r) => this.rowToAsset(r));
  }

  private rowToAsset(row: any): WorkAsset {
    return {
      id: row.id,
      taskId: row.task_id,
      sessionId: row.session_id ?? '',
      agentId: row.agent_id,
      type: row.type,
      name: row.name,
      path: row.path,
      size: row.size ?? undefined,
      mimeType: row.mime_type ?? undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
    };
  }

  // ==================== 统计 ====================

  getExecutorStats(): ExecutorState {
    const stats = this.db
      .prepare(
        `SELECT
          COUNT(*) FILTER (WHERE status IN ('pending','running')) as active,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'completed') as succeeded,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
         FROM executor_tasks`
      )
      .get() as any;

    const sessions = this.db
      .prepare(
        `SELECT COUNT(*) as active FROM executor_sessions WHERE status = 'active'`
      )
      .get() as any;

    return {
      running: true,
      tasksProcessed: stats.total ?? 0,
      tasksSucceeded: stats.succeeded ?? 0,
      tasksFailed: stats.failed ?? 0,
      activeSessions: sessions?.active ?? 0,
      lastHeartbeat: new Date().toISOString(),
    };
  }
}

// ============ 全局单例 ============

let _db: ExecutorDB | null = null;

export function initExecutorDb(dbPath?: string): ExecutorDB {
  _db = new ExecutorDB(dbPath);
  return _db;
}

export function getExecutorDb(): ExecutorDB {
  if (!_db) {
    _db = new ExecutorDB();
  }
  return _db;
}
