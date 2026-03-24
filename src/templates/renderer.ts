/**
 * 模板渲染器
 * 参考 DeerFlow 的 templates 目录结构
 * 支持从技能目录加载模板并渲染输出
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Skill } from '../types.js';

export interface TemplateData {
  [key: string]: any;
}

export class TemplateRenderer {
  private templateCache: Map<string, string> = new Map();

  /**
   * 从技能目录加载模板
   */
  async loadTemplate(skill: Skill, templateName: string): Promise<string> {
    const cacheKey = `${skill.manifest.name}:${templateName}`;
    
    // 检查缓存
    const cached = this.templateCache.get(cacheKey);
    if (cached) return cached;
    
    // 从文件加载
    const templatePath = path.join(skill.path, 'templates', `${templateName}.md`);
    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      this.templateCache.set(cacheKey, content);
      return content;
    } catch {
      // 模板不存在，返回默认模板
      return this.getDefaultTemplate(templateName);
    }
  }

  /**
   * 渲染模板
   */
  render(template: string, data: TemplateData): string {
    let result = template;
    
    // 简单变量替换 {{ variable }}
    result = result.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      return data[key] !== undefined ? String(data[key]) : '';
    });
    
    // 条件渲染 {{#if condition}}...{{/if}}
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
      return data[key] ? content : '';
    });
    
    // 列表渲染 {{#each items}}...{{/each}}
    result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, content) => {
      const items = data[key];
      if (!Array.isArray(items)) return '';
      
      return items.map((item, index) => {
        let itemContent = content;
        // 替换 {{this}} 和 {{@index}}
        itemContent = itemContent.replace(/\{\{\s*this\s*\}\}/g, String(item));
        itemContent = itemContent.replace(/\{\{\s*@index\s*\}\}/g, String(index));
        
        // 替换对象属性 {{this.property}}
        if (typeof item === 'object' && item !== null) {
          itemContent = itemContent.replace(/\{\{\s*this\.(\w+)\s*\}\}/g, (_, prop) => {
            return item[prop] !== undefined ? String(item[prop]) : '';
          });
        }
        
        return itemContent;
      }).join('');
    });
    
    return result;
  }

  /**
   * 加载并渲染模板
   */
  async renderTemplate(skill: Skill, templateName: string, data: TemplateData): Promise<string> {
    const template = await this.loadTemplate(skill, templateName);
    return this.render(template, data);
  }

  /**
   * 渲染 JSON 输出
   */
  renderJson(data: TemplateData, pretty: boolean = true): string {
    return JSON.stringify(data, null, pretty ? 2 : 0);
  }

  /**
   * 渲染 Markdown 表格
   */
  renderTable(headers: string[], rows: any[][]): string {
    const headerRow = `| ${headers.join(' | ')} |`;
    const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
    const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
    
    return `${headerRow}\n${separatorRow}\n${dataRows}`;
  }

  /**
   * 渲染代码块
   */
  renderCodeBlock(code: string, language: string = ''): string {
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  /**
   * 清空模板缓存
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * 获取默认模板
   */
  private getDefaultTemplate(templateName: string): string {
    const defaults: Record<string, string> = {
      'output': `# 执行结果

## 成功
{{ success }}

## 输出
{{ output }}

## 耗时
{{ durationMs }}ms
`,
      'error': `# 执行失败

## 错误信息
{{ error }}

## 建议
请检查输入参数或重试。
`
    };
    
    return defaults[templateName] || '{{ output }}';
  }
}