/**
 * 文件缓存
 * 参考 DeerFlow 的文件 hash 缓存策略
 * 用于缓存文件处理结果，避免重复计算
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ensureDir } from '../utils.js';

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export class FileCache {
  private cacheDir: string;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number; // 毫秒

  constructor(cacheDir: string = '/tmp/.agentwork-cache', defaultTTL: number = 24 * 60 * 60 * 1000) {
    this.cacheDir = cacheDir;
    this.defaultTTL = defaultTTL;
  }

  /**
   * 初始化缓存目录
   */
  async init(): Promise<void> {
    await ensureDir(this.cacheDir);
  }

  /**
   * 计算文件 hash
   */
  async computeFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 计算多个文件的组合 hash
   */
  async computeFilesHash(filePaths: string[]): Promise<string> {
    const hashes = await Promise.all(
      filePaths.map(f => this.computeFileHash(f))
    );
    return crypto.createHash('sha256').update(hashes.join('|')).digest('hex');
  }

  /**
   * 生成缓存 key
   */
  generateKey(prefix: string, ...parts: string[]): string {
    const combined = parts.join(':');
    const hash = crypto.createHash('md5').update(combined).digest('hex');
    return `${prefix}-${hash}`;
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    // 先查内存缓存
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (memEntry.expiresAt && memEntry.expiresAt < new Date()) {
        this.memoryCache.delete(key);
        return null;
      }
      return memEntry.data as T;
    }

    // 查文件缓存
    const cachePath = this.getCachePath(key);
    try {
      const content = await fs.readFile(cachePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);
      
      // 检查过期
      if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
        await fs.unlink(cachePath).catch(() => {});
        return null;
      }
      
      // 回填内存缓存
      this.memoryCache.set(key, entry);
      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * 设置缓存
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const expiresAt = ttl 
      ? new Date(Date.now() + ttl) 
      : new Date(Date.now() + this.defaultTTL);
    
    const entry: CacheEntry<T> = {
      key,
      data,
      createdAt: new Date(),
      expiresAt
    };
    
    // 内存缓存
    this.memoryCache.set(key, entry);
    
    // 文件缓存
    const cachePath = this.getCachePath(key);
    await fs.writeFile(cachePath, JSON.stringify(entry), 'utf-8');
  }

  /**
   * 获取或计算（核心方法）
   * 如果缓存存在则返回，否则执行 computeFn 并缓存结果
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const result = await computeFn();
    await this.set(key, result, ttl);
    return result;
  }

  /**
   * 基于文件 hash 的缓存
   * 文件变化时自动失效
   */
  async getOrComputeForFiles<T>(
    files: string[],
    operation: string,
    computeFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const filesHash = await this.computeFilesHash(files);
    const key = this.generateKey(operation, filesHash);
    return this.getOrCompute(key, computeFn, ttl);
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    const cachePath = this.getCachePath(key);
    await fs.unlink(cachePath).catch(() => {});
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    const entries = await fs.readdir(this.cacheDir).catch(() => []);
    for (const entry of entries) {
      await fs.unlink(path.join(this.cacheDir, entry)).catch(() => {});
    }
  }

  /**
   * 获取缓存路径
   */
  private getCachePath(key: string): string {
    // 安全化 key
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    memoryCount: number;
    memorySize: number;
  } {
    let memorySize = 0;
    for (const entry of this.memoryCache.values()) {
      memorySize += JSON.stringify(entry).length;
    }
    
    return {
      memoryCount: this.memoryCache.size,
      memorySize
    };
  }
}