/**
 * 向量存储实现
 * 使用 SQLite 存储向量和元数据
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { expandHome, ensureDir } from '../utils.js';
import { VectorStoreConfig, VectorEntry, StoreOptions } from './types.js';
import * as path from 'path';

/**
 * 向量存储类
 */
export class VectorStore {
  private db: DBType;
  private config: VectorStoreConfig;

  constructor(config: VectorStoreConfig) {
    this.config = config;

    // 确保目录存在
    const dbDir = path.dirname(expandHome(this.config.dbPath));
    ensureDir(dbDir);

    // 初始化数据库
    this.db = new Database(expandHome(this.config.dbPath));
    this.db.pragma('journal_mode = WAL');

    // 创建表
    this.initializeSchema();
  }

  /**
   * 初始化数据库 schema
   */
  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vectors (
        id TEXT PRIMARY KEY,
        vector TEXT NOT NULL,
        text TEXT NOT NULL,
        metadata TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_vectors_created ON vectors(created_at);
    `);
  }

  /**
   * 添加向量
   */
  async add(
    text: string,
    vector: number[],
    options?: StoreOptions
  ): Promise<VectorEntry> {
    const id = uuidv4();
    const createdAt = Date.now();

    // 验证向量维度
    if (vector.length !== this.config.dimensions) {
      throw new Error(
        `Vector dimension mismatch: expected ${this.config.dimensions}, got ${vector.length}`
      );
    }

    const stmt = this.db.prepare(`
      INSERT INTO vectors (id, vector, text, metadata, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      JSON.stringify(vector),
      text,
      options?.metadata ? JSON.stringify(options.metadata) : null,
      createdAt
    );

    return {
      id,
      vector,
      text,
      metadata: options?.metadata,
      createdAt
    };
  }

  /**
   * 批量添加向量
   */
  async addBatch(
    items: Array<{ text: string; vector: number[]; metadata?: Record<string, any> }>
  ): Promise<VectorEntry[]> {
    const insertStmt = this.db.prepare(`
      INSERT INTO vectors (id, vector, text, metadata, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const entries: VectorEntry[] = [];
    const createdAt = Date.now();

    this.db.transaction(() => {
      for (const item of items) {
        const id = uuidv4();

        if (item.vector.length !== this.config.dimensions) {
          throw new Error(
            `Vector dimension mismatch: expected ${this.config.dimensions}, got ${item.vector.length}`
          );
        }

        insertStmt.run(
          id,
          JSON.stringify(item.vector),
          item.text,
          item.metadata ? JSON.stringify(item.metadata) : null,
          createdAt
        );

        entries.push({
          id,
          vector: item.vector,
          text: item.text,
          metadata: item.metadata,
          createdAt
        });
      }
    })();

    return entries;
  }

  /**
   * 获取向量
   */
  async get(id: string): Promise<VectorEntry | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM vectors WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return this.rowToVectorEntry(row);
  }

  /**
   * 删除向量
   */
  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM vectors WHERE id = ?
    `);

    const result = stmt.run(id);
    if (result.changes === 0) {
      throw new Error(`Vector ${id} not found`);
    }
  }

  /**
   * 列出所有向量
   */
  async list(options?: {
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    offset?: number;
  }): Promise<VectorEntry[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options?.startTime) {
      conditions.push('created_at >= ?');
      params.push(options.startTime.getTime());
    }

    if (options?.endTime) {
      conditions.push('created_at <= ?');
      params.push(options.endTime.getTime());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = options?.limit ? `LIMIT ?` : '';
    const offsetClause = options?.offset ? `OFFSET ?` : '';

    const stmt = this.db.prepare(`
      SELECT * FROM vectors ${whereClause} ORDER BY created_at DESC ${limitClause} ${offsetClause}
    `);

    const rows = stmt.all(
      ...params,
      ...(options?.limit ? [options.limit] : []),
      ...(options?.offset ? [options.offset] : [])
    ) as any[];

    return rows.map(row => this.rowToVectorEntry(row));
  }

  /**
   * 获取向量数量
   */
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM vectors`);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * 清空所有向量
   */
  clear(): void {
    this.db.exec(`DELETE FROM vectors`);
  }

  /**
   * 将数据库行转换为 VectorEntry
   */
  private rowToVectorEntry(row: any): VectorEntry {
    return {
      id: row.id,
      vector: JSON.parse(row.vector),
      text: row.text,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at
    };
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }
}
