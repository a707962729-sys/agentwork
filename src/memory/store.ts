/**
 * 记忆存储实现
 * 使用 SQLite 存储记忆数据
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { expandHome, ensureDir } from '../utils.js';
import { MemoryLevel, MemoryEntry } from '../types.js';
import { MemoryStoreConfig, StoreOptions } from './types.js';
import * as path from 'path';
import { createEmbedder, VectorStore } from '../vector/index.js';
import type { Embedder } from '../vector/index.js';

/**
 * 记忆存储类
 */
export class MemoryStore {
  private db: DBType;
  private config: MemoryStoreConfig;
  private embedder: Embedder | null = null;
  private vectorStore: VectorStore | null = null;

  constructor(config: MemoryStoreConfig, openaiApiKey?: string) {
    this.config = {
      dbPath: config.dbPath,
      enableVectorSearch: config.enableVectorSearch ?? false,
      vectorDimensions: config.vectorDimensions ?? 1536
    };

    // 确保目录存在
    const dbDir = path.dirname(expandHome(this.config.dbPath));
    ensureDir(dbDir);

    // 初始化数据库
    this.db = new Database(expandHome(this.config.dbPath));
    this.db.pragma('journal_mode = WAL');
    
    // 创建表
    this.initializeSchema();

    // 如果启用了向量检索，初始化 embedder 和 vector store
    if (this.config.enableVectorSearch && openaiApiKey) {
      this.embedder = createEmbedder({
        provider: 'openai',
        apiKey: openaiApiKey,
        model: 'text-embedding-3-small',
        dimensions: this.config.vectorDimensions
      });

      // 使用独立的向量数据库
      const vectorDbPath = this.config.dbPath.replace('.db', '-vectors.db');
      this.vectorStore = new VectorStore({
        dbPath: vectorDbPath,
        dimensions: this.config.vectorDimensions ?? 1536
      });
    }
  }

  /**
   * 初始化数据库 schema
   */
  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        level TEXT NOT NULL,
        project_id TEXT,
        task_id TEXT,
        session_id TEXT,
        content TEXT NOT NULL,
        metadata TEXT,
        embedding TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memories_level ON memories(level);
      CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project_id);
      CREATE INDEX IF NOT EXISTS idx_memories_task ON memories(task_id);
      CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(session_id);
      CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
    `);
  }

  /**
   * 存储记忆
   */
  async store(level: MemoryLevel, content: string, options?: StoreOptions): Promise<MemoryEntry> {
    const id = uuidv4();
    const createdAt = Date.now();

    // 如果启用了向量检索且没有提供 embedding，自动生成
    let embedding = options?.embedding;
    if (this.config.enableVectorSearch && this.embedder && !embedding) {
      try {
        embedding = await this.embedder.embed(content);
      } catch (error) {
        console.warn('Failed to generate embedding:', error);
      }
    }

    const stmt = this.db.prepare(`
      INSERT INTO memories (id, level, project_id, task_id, session_id, content, metadata, embedding, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      level,
      options?.projectId || null,
      options?.taskId || null,
      options?.sessionId || null,
      content,
      options?.metadata ? JSON.stringify(options.metadata) : null,
      embedding ? JSON.stringify(embedding) : null,
      createdAt
    );

    // 如果启用了向量存储，同时存储到向量索引
    if (this.vectorStore && embedding) {
      try {
        await this.vectorStore.add(content, embedding, {
          metadata: {
            ...options?.metadata,
            memoryId: id,
            level,
            projectId: options?.projectId,
            taskId: options?.taskId,
            sessionId: options?.sessionId
          }
        });
      } catch (error) {
        console.warn('Failed to store vector:', error);
      }
    }

    return {
      id,
      level,
      projectId: options?.projectId,
      taskId: options?.taskId,
      content,
      metadata: options?.metadata,
      embedding,
      createdAt: new Date(createdAt)
    };
  }

  /**
   * 获取记忆
   */
  async get(id: string): Promise<MemoryEntry | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM memories WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return this.rowToMemoryEntry(row);
  }

  /**
   * 更新记忆
   */
  async update(id: string, content: string): Promise<MemoryEntry> {
    const stmt = this.db.prepare(`
      UPDATE memories SET content = ? WHERE id = ?
    `);

    const result = stmt.run(content, id);
    if (result.changes === 0) {
      throw new Error(`Memory ${id} not found`);
    }

    const updated = await this.get(id);
    if (!updated) {
      throw new Error(`Failed to retrieve updated memory ${id}`);
    }

    return updated;
  }

  /**
   * 删除记忆
   */
  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM memories WHERE id = ?
    `);

    const result = stmt.run(id);
    if (result.changes === 0) {
      throw new Error(`Memory ${id} not found`);
    }
  }

  /**
   * 列出记忆
   */
  async list(options?: {
    levels?: MemoryLevel[];
    projectId?: string;
    taskId?: string;
    sessionId?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<MemoryEntry[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options?.levels && options.levels.length > 0) {
      conditions.push(`level IN (${options.levels.map(() => '?').join(',')})`);
      params.push(...options.levels);
    }

    if (options?.projectId) {
      conditions.push('project_id = ?');
      params.push(options.projectId);
    }

    if (options?.taskId) {
      conditions.push('task_id = ?');
      params.push(options.taskId);
    }

    if (options?.sessionId) {
      conditions.push('session_id = ?');
      params.push(options.sessionId);
    }

    if (options?.startTime) {
      conditions.push('created_at >= ?');
      params.push(options.startTime.getTime());
    }

    if (options?.endTime) {
      conditions.push('created_at <= ?');
      params.push(options.endTime.getTime());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const stmt = this.db.prepare(`
      SELECT * FROM memories ${whereClause} ORDER BY created_at DESC
    `);

    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.rowToMemoryEntry(row));
  }

  /**
   * 将数据库行转换为 MemoryEntry
   */
  private rowToMemoryEntry(row: any): MemoryEntry {
    return {
      id: row.id,
      level: row.level as MemoryLevel,
      projectId: row.project_id,
      taskId: row.task_id,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
    if (this.vectorStore) {
      this.vectorStore.close();
    }
  }
}
