/**
 * Context Offloader - 状态卸载器
 * 
 * 功能:
 * 1. 将状态保存到外部存储
 * 2. 需要时再加载回来
 * 3. 支持增量加载
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { expandHome, ensureDir } from '../utils.js';
import * as path from 'path';
import * as fs from 'fs';
import {
  OffloadConfig,
  OffloadedState,
  OffloadStorageType,
} from './types.js';

/**
 * 默认卸载配置
 */
export const DEFAULT_OFFLOAD_CONFIG: OffloadConfig = {
  type: 'sqlite',
  path: '~/.agentwork/context-offload.db',
  incrementalLoad: true,
  chunkSize: 100,
};

/**
 * 状态卸载器
 */
export class Offloader {
  private config: OffloadConfig;
  private db: Database.Database | null = null;
  private memoryCache: Map<string, OffloadedState> = new Map();
  private initialized: boolean = false;

  constructor(config?: Partial<OffloadConfig>) {
    this.config = { ...DEFAULT_OFFLOAD_CONFIG, ...config };
  }

  /**
   * 初始化存储
   */
  private initialize(): void {
    if (this.initialized) return;

    switch (this.config.type) {
      case 'sqlite':
        this.initSqlite();
        break;
      case 'file':
        this.initFileStorage();
        break;
      case 'memory':
        // 内存存储无需初始化
        break;
    }

    this.initialized = true;
  }

  /**
   * 初始化 SQLite 存储
   */
  private initSqlite(): void {
    const dbPath = expandHome(this.config.path || DEFAULT_OFFLOAD_CONFIG.path!);
    const dbDir = path.dirname(dbPath);
    ensureDir(dbDir);

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS offloaded_states (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        data TEXT NOT NULL,
        metadata TEXT,
        created_at INTEGER NOT NULL,
        last_accessed_at INTEGER NOT NULL,
        access_count INTEGER DEFAULT 0,
        size INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_offloaded_key ON offloaded_states(key);
      CREATE INDEX IF NOT EXISTS idx_offloaded_accessed ON offloaded_states(last_accessed_at);
    `);
  }

  /**
   * 初始化文件存储
   */
  private initFileStorage(): void {
    const storagePath = expandHome(this.config.path || DEFAULT_OFFLOAD_CONFIG.path!);
    ensureDir(storagePath);

    // 创建元数据文件
    const metaPath = path.join(storagePath, 'metadata.json');
    if (!fs.existsSync(metaPath)) {
      fs.writeFileSync(metaPath, JSON.stringify({}, null, 2));
    }
  }

  /**
   * 卸载状态
   * @param state 状态数据
   * @param key 状态键 (可选，自动生成)
   * @param metadata 元数据
   * @returns 状态 ID
   */
  async offload(
    state: any,
    key?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    this.initialize();

    const id = uuidv4();
    const stateKey = key || `state-${Date.now()}`;
    const now = Date.now();
    const dataStr = JSON.stringify(state);
    const size = Buffer.byteLength(dataStr, 'utf-8');

    const offloaded: OffloadedState = {
      id,
      key: stateKey,
      data: state,
      metadata,
      createdAt: new Date(now),
      lastAccessedAt: new Date(now),
      accessCount: 0,
      size,
    };

    switch (this.config.type) {
      case 'sqlite':
        this.offloadToSqlite(offloaded, dataStr);
        break;
      case 'file':
        this.offloadToFile(offloaded, dataStr);
        break;
      case 'memory':
        this.offloadToMemory(offloaded);
        break;
    }

    return id;
  }

  /**
   * 加载状态
   * @param key 状态键或 ID
   * @returns 状态数据
   */
  async load(key: string): Promise<any> {
    this.initialize();

    switch (this.config.type) {
      case 'sqlite':
        return this.loadFromSqlite(key);
      case 'file':
        return this.loadFromFile(key);
      case 'memory':
        return this.loadFromMemory(key);
      default:
        throw new Error(`Unknown storage type: ${this.config.type}`);
    }
  }

  /**
   * 删除卸载的状态
   * @param key 状态键或 ID
   */
  async delete(key: string): Promise<void> {
    this.initialize();

    switch (this.config.type) {
      case 'sqlite':
        this.deleteFromSqlite(key);
        break;
      case 'file':
        this.deleteFromFile(key);
        break;
      case 'memory':
        this.deleteFromMemory(key);
        break;
    }
  }

  /**
   * 列出所有卸载的状态
   */
  async list(): Promise<OffloadedState[]> {
    this.initialize();

    switch (this.config.type) {
      case 'sqlite':
        return this.listFromSqlite();
      case 'file':
        return this.listFromFile();
      case 'memory':
        return this.listFromMemory();
      default:
        return [];
    }
  }

  /**
   * 增量加载
   * @param key 状态键或 ID
   * @param chunkSize 分块大小
   */
  async loadIncremental(
    key: string,
    chunkSize?: number
  ): Promise<AsyncGenerator<any[], void, unknown>> {
    this.initialize();
    const size = chunkSize || this.config.chunkSize || 100;

    const state = await this.load(key);
    
    // 如果状态是数组，支持增量加载
    if (Array.isArray(state)) {
      return this.incrementalArrayLoad(state, size);
    }

    // 非数组，一次性返回
    return (async function* () {
      yield [state];
    })();
  }

  /**
   * 数组增量加载生成器
   */
  private async *incrementalArrayLoad(
    arr: any[],
    chunkSize: number
  ): AsyncGenerator<any[], void, unknown> {
    for (let i = 0; i < arr.length; i += chunkSize) {
      yield arr.slice(i, i + chunkSize);
    }
  }

  /**
   * 获取存储统计
   */
  async getStats(): Promise<{
    totalCount: number;
    totalSize: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  }> {
    this.initialize();

    const states = await this.list();
    let totalSize = 0;
    let oldest: Date | undefined;
    let newest: Date | undefined;

    for (const state of states) {
      totalSize += state.size;
      if (!oldest || state.createdAt < oldest) {
        oldest = state.createdAt;
      }
      if (!newest || state.createdAt > newest) {
        newest = state.createdAt;
      }
    }

    return {
      totalCount: states.length,
      totalSize,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }

  /**
   * 清理过期状态
   * @param maxAge 最大保留时间 (毫秒)
   */
  async cleanup(maxAge: number): Promise<number> {
    this.initialize();
    const cutoff = Date.now() - maxAge;
    let deleted = 0;

    switch (this.config.type) {
      case 'sqlite':
        deleted = this.cleanupSqlite(cutoff);
        break;
      case 'file':
        deleted = await this.cleanupFile(cutoff);
        break;
      case 'memory':
        deleted = this.cleanupMemory(cutoff);
        break;
    }

    return deleted;
  }

  /**
   * 关闭存储
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.memoryCache.clear();
    this.initialized = false;
  }

  // ==================== SQLite 实现 ====================

  private offloadToSqlite(state: OffloadedState, dataStr: string): void {
    if (!this.db) throw new Error('SQLite not initialized');

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO offloaded_states 
      (id, key, data, metadata, created_at, last_accessed_at, access_count, size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      state.id,
      state.key,
      dataStr,
      state.metadata ? JSON.stringify(state.metadata) : null,
      state.createdAt.getTime(),
      state.lastAccessedAt.getTime(),
      state.accessCount,
      state.size
    );
  }

  private loadFromSqlite(key: string): any {
    if (!this.db) throw new Error('SQLite not initialized');

    // 先尝试按 key 查找
    let stmt = this.db.prepare(`
      SELECT * FROM offloaded_states WHERE key = ?
    `);
    let row = stmt.get(key) as any;

    // 如果没找到，按 id 查找
    if (!row) {
      stmt = this.db.prepare(`
        SELECT * FROM offloaded_states WHERE id = ?
      `);
      row = stmt.get(key) as any;
    }

    if (!row) {
      throw new Error(`State not found: ${key}`);
    }

    // 更新访问信息
    const updateStmt = this.db.prepare(`
      UPDATE offloaded_states 
      SET last_accessed_at = ?, access_count = access_count + 1
      WHERE id = ?
    `);
    updateStmt.run(Date.now(), row.id);

    return JSON.parse(row.data);
  }

  private deleteFromSqlite(key: string): void {
    if (!this.db) throw new Error('SQLite not initialized');

    const stmt = this.db.prepare(`
      DELETE FROM offloaded_states WHERE key = ? OR id = ?
    `);
    stmt.run(key, key);
  }

  private listFromSqlite(): OffloadedState[] {
    if (!this.db) throw new Error('SQLite not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM offloaded_states ORDER BY created_at DESC
    `);
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      id: row.id,
      key: row.key,
      data: JSON.parse(row.data),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      lastAccessedAt: new Date(row.last_accessed_at),
      accessCount: row.access_count,
      size: row.size,
    }));
  }

  private cleanupSqlite(cutoff: number): number {
    if (!this.db) throw new Error('SQLite not initialized');

    const stmt = this.db.prepare(`
      DELETE FROM offloaded_states WHERE created_at < ?
    `);
    const result = stmt.run(cutoff);
    return result.changes;
  }

  // ==================== 文件存储实现 ====================

  private offloadToFile(state: OffloadedState, dataStr: string): void {
    const storagePath = expandHome(this.config.path || DEFAULT_OFFLOAD_CONFIG.path!);
    const stateFile = path.join(storagePath, `${state.key}.json`);

    fs.writeFileSync(stateFile, JSON.stringify({
      ...state,
      data: state.data,
    }, null, 2));

    // 更新元数据
    const metaPath = path.join(storagePath, 'metadata.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    meta[state.key] = {
      id: state.id,
      size: state.size,
      createdAt: state.createdAt,
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  }

  private loadFromFile(key: string): any {
    const storagePath = expandHome(this.config.path || DEFAULT_OFFLOAD_CONFIG.path!);
    const stateFile = path.join(storagePath, `${key}.json`);

    if (!fs.existsSync(stateFile)) {
      throw new Error(`State not found: ${key}`);
    }

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    
    // 更新访问时间
    state.lastAccessedAt = new Date();
    state.accessCount = (state.accessCount || 0) + 1;
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

    return state.data;
  }

  private deleteFromFile(key: string): void {
    const storagePath = expandHome(this.config.path || DEFAULT_OFFLOAD_CONFIG.path!);
    const stateFile = path.join(storagePath, `${key}.json`);

    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }

    // 更新元数据
    const metaPath = path.join(storagePath, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      delete meta[key];
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    }
  }

  private listFromFile(): OffloadedState[] {
    const storagePath = expandHome(this.config.path || DEFAULT_OFFLOAD_CONFIG.path!);
    const files = fs.readdirSync(storagePath).filter(f => f.endsWith('.json') && f !== 'metadata.json');

    return files.map(file => {
      const content = fs.readFileSync(path.join(storagePath, file), 'utf-8');
      return JSON.parse(content) as OffloadedState;
    });
  }

  private async cleanupFile(cutoff: number): Promise<number> {
    const storagePath = expandHome(this.config.path || DEFAULT_OFFLOAD_CONFIG.path!);
    const states = this.listFromFile();
    let deleted = 0;

    for (const state of states) {
      if (state.createdAt.getTime() < cutoff) {
        this.deleteFromFile(state.key);
        deleted++;
      }
    }

    return deleted;
  }

  // ==================== 内存存储实现 ====================

  private offloadToMemory(state: OffloadedState): void {
    const maxEntries = this.config.maxEntries || 1000;

    // 如果超过最大条目数，删除最旧的
    if (this.memoryCache.size >= maxEntries) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].lastAccessedAt.getTime() - b[1].lastAccessedAt.getTime());
      
      const toDelete = entries.slice(0, entries.length - maxEntries + 1);
      for (const [key] of toDelete) {
        this.memoryCache.delete(key);
      }
    }

    this.memoryCache.set(state.key, state);
  }

  private loadFromMemory(key: string): any {
    const state = this.memoryCache.get(key);

    if (!state) {
      throw new Error(`State not found: ${key}`);
    }

    // 更新访问信息
    state.lastAccessedAt = new Date();
    state.accessCount++;

    return state.data;
  }

  private deleteFromMemory(key: string): void {
    this.memoryCache.delete(key);
  }

  private listFromMemory(): OffloadedState[] {
    return Array.from(this.memoryCache.values());
  }

  private cleanupMemory(cutoff: number): number {
    let deleted = 0;

    for (const [key, state] of this.memoryCache.entries()) {
      if (state.createdAt.getTime() < cutoff) {
        this.memoryCache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }
}

/**
 * 创建卸载器实例
 */
export function createOffloader(config?: Partial<OffloadConfig>): Offloader {
  return new Offloader(config);
}