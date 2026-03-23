/**
 * 技能注册中心
 * 完全兼容 OpenClaw Skills 格式
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import { Skill, SkillManifest } from '../types.js';
import { expandHome, ensureDir } from '../utils.js';
import { DatabaseManager } from '../db/index.js';

export { SkillMatcher, MatchResult } from './matcher.js';

export class SkillsRegistry {
  private db: DatabaseManager;
  private skillsDir: string;
  private openclawSkillsDir: string;
  private loadedSkills: Map<string, Skill> = new Map();

  constructor(db: DatabaseManager, skillsDir: string) {
    this.db = db;
    this.skillsDir = expandHome(skillsDir);
    this.openclawSkillsDir = expandHome('~/.openclaw/skills');
  }

  /**
   * 初始化，加载所有技能
   */
  async init(): Promise<void> {
    await ensureDir(this.skillsDir);

    // 加载平台技能
    await this.loadFromDirectory(this.skillsDir);

    // 加载 OpenClaw 共享技能
    try {
      await this.loadFromDirectory(this.openclawSkillsDir);
    } catch {
      // OpenClaw 技能目录可能不存在
    }

    // 从数据库加载已安装的技能
    const dbSkills = this.db.listSkills();
    for (const skill of dbSkills) {
      this.loadedSkills.set(skill.manifest.name, skill);
    }
  }

  /**
   * 从目录加载技能
   */
  private async loadFromDirectory(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const skillPath = path.join(dir, entry.name);
        const skill = await this.loadSkillFromPath(skillPath);

        if (skill) {
          this.loadedSkills.set(skill.manifest.name, skill);
        }
      }
    } catch (error) {
      // 目录不存在或无法读取
    }
  }

  /**
   * 从路径加载技能
   */
  private async loadSkillFromPath(skillPath: string): Promise<Skill | null> {
    const skillMdPath = path.join(skillPath, 'SKILL.md');

    try {
      const content = await fs.readFile(skillMdPath, 'utf-8');
      const manifest = this.parseSkillMd(content);

      if (!manifest) return null;

      return {
        path: skillPath,
        manifest,
        content
      };
    } catch {
      return null;
    }
  }

  /**
   * 解析 SKILL.md 文件
   * 兼容 OpenClaw 格式
   */
  private parseSkillMd(content: string): SkillManifest | null {
    try {
      // 解析 YAML frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        return this.parseFromContent(content);
      }

      const frontmatter = parseYaml(frontmatterMatch[1]);
      return {
        name: frontmatter.name || '',
        description: frontmatter.description || '',
        category: frontmatter.metadata?.category,
        triggers: frontmatter.metadata?.triggers,
        author: frontmatter.metadata?.author,
        version: frontmatter.metadata?.version,
        requires: frontmatter.requires
      };
    } catch {
      return this.parseFromContent(content);
    }
  }

  /**
   * 从内容解析技能（无 frontmatter 情况）
   */
  private parseFromContent(content: string): SkillManifest {
    const lines = content.split('\n');
    let name = '';
    let description = '';

    for (const line of lines) {
      if (line.startsWith('# ') && !name) {
        name = line.slice(2).trim();
      } else if (line.trim() && !line.startsWith('#') && !description) {
        description = line.trim();
      }
    }

    return { name, description };
  }

  /**
   * 安装技能
   */
  async install(source: string): Promise<Skill> {
    let skill: Skill | null = null;

    if (source.startsWith('clawhub:')) {
      skill = await this.installFromClawHub(source.slice(8));
    } else if (source.startsWith('@') || source.includes('/')) {
      try {
        const expandedPath = expandHome(source);
        skill = await this.loadSkillFromPath(expandedPath);
      } catch {
        throw new Error(`npm 安装暂未实现: ${source}`);
      }
    } else {
      const expandedPath = expandHome(source);
      skill = await this.loadSkillFromPath(expandedPath);
    }

    if (!skill) {
      throw new Error(`无法加载技能: ${source}`);
    }

    // 复制到技能目录
    const targetPath = path.join(this.skillsDir, skill.manifest.name);
    await this.copySkill(skill.path, targetPath);

    // 更新路径并保存
    skill.path = targetPath;
    this.db.saveSkill(skill);
    this.loadedSkills.set(skill.manifest.name, skill);

    return skill;
  }

  /**
   * 从 ClawHub 安装
   */
  private async installFromClawHub(skillName: string): Promise<Skill | null> {
    throw new Error('ClawHub 安装暂未实现');
  }

  /**
   * 复制技能目录
   */
  private async copySkill(src: string, dest: string): Promise<void> {
    await ensureDir(dest);
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copySkill(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * 卸载技能
   */
  async uninstall(skillName: string): Promise<void> {
    const skill = this.loadedSkills.get(skillName);
    if (!skill) {
      throw new Error(`技能未安装: ${skillName}`);
    }

    try {
      await fs.rm(skill.path, { recursive: true });
    } catch {}

    this.loadedSkills.delete(skillName);
  }

  /**
   * 获取技能
   */
  async load(skillName: string): Promise<Skill | null> {
    return this.loadedSkills.get(skillName) || null;
  }

  /**
   * 列出所有技能
   */
  list(): Skill[] {
    return Array.from(this.loadedSkills.values());
  }

  /**
   * 搜索技能
   */
  search(query: string): Skill[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(skill =>
      skill.manifest.name.toLowerCase().includes(lowerQuery) ||
      skill.manifest.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 根据触发词匹配技能
   */
  matchByTrigger(input: string): Skill[] {
    const lowerInput = input.toLowerCase();
    return this.list().filter(skill => {
      if (!skill.manifest.triggers) return false;
      return skill.manifest.triggers.some(trigger =>
        lowerInput.includes(trigger.toLowerCase())
      );
    });
  }
}