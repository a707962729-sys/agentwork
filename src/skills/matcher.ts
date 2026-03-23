/**
 * 技能匹配器
 * 参考 DeerFlow 的智能匹配逻辑
 * 支持触发词匹配、语义相似度匹配
 */

import { Skill } from '../types.js';

export interface MatchResult {
  skill: Skill;
  score: number;
  matchType: 'trigger' | 'semantic' | 'fallback';
  matchedTriggers?: string[];
}

export class SkillMatcher {
  private skillVectors: Map<string, number[]> = new Map();
  
  /**
   * 匹配最相关的技能
   */
  matchBest(input: string, skills: Skill[]): MatchResult | null {
    const results = this.matchAll(input, skills);
    if (results.length === 0) return null;
    
    // 按分数排序，返回最高分
    results.sort((a, b) => b.score - a.score);
    return results[0];
  }
  
  /**
   * 匹配所有相关技能
   */
  matchAll(input: string, skills: Skill[]): MatchResult[] {
    const results: MatchResult[] = [];
    const lowerInput = input.toLowerCase();
    
    for (const skill of skills) {
      // 1. 触发词精确匹配
      const triggerResult = this.matchByTrigger(input, skill);
      if (triggerResult) {
        results.push(triggerResult);
        continue;
      }
      
      // 2. 描述关键词匹配
      const keywordResult = this.matchByKeywords(input, skill);
      if (keywordResult && keywordResult.score > 0.3) {
        results.push(keywordResult);
      }
    }
    
    return results;
  }
  
  /**
   * 触发词匹配
   */
  private matchByTrigger(input: string, skill: Skill): MatchResult | null {
    const triggers = skill.manifest.triggers;
    if (!triggers || triggers.length === 0) return null;
    
    const lowerInput = input.toLowerCase();
    const matchedTriggers: string[] = [];
    let maxScore = 0;
    
    for (const trigger of triggers) {
      const lowerTrigger = trigger.toLowerCase();
      
      if (lowerInput.includes(lowerTrigger)) {
        matchedTriggers.push(trigger);
        // 完全匹配得分更高
        const score = lowerInput === lowerTrigger ? 1.0 : 0.8;
        maxScore = Math.max(maxScore, score);
      }
    }
    
    if (matchedTriggers.length === 0) return null;
    
    return {
      skill,
      score: maxScore,
      matchType: 'trigger',
      matchedTriggers
    };
  }
  
  /**
   * 关键词匹配（从 description 提取）
   */
  private matchByKeywords(input: string, skill: Skill): MatchResult | null {
    const description = skill.manifest.description.toLowerCase();
    const lowerInput = input.toLowerCase();
    
    // 提取关键词
    const keywords = this.extractKeywords(description);
    const inputWords = lowerInput.split(/\s+/);
    
    let matches = 0;
    for (const word of inputWords) {
      if (word.length < 2) continue;
      if (keywords.some(kw => kw.includes(word) || word.includes(kw))) {
        matches++;
      }
    }
    
    const score = inputWords.length > 0 ? matches / inputWords.length : 0;
    
    return {
      skill,
      score,
      matchType: 'semantic'
    };
  }
  
  /**
   * 从描述中提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 移除标点，分词
    const words = text
      .replace(/[，。！？、；：""''（）【】《》]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);
    
    // 停用词
    const stopWords = new Set([
      '的', '是', '在', '有', '和', '了', '不', '这', '为', '以',
      '及', '与', '或', '等', '可', '能', '会', '对', '也', '都',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'shall',
      'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in',
      'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into'
    ]);
    
    return words.filter(w => !stopWords.has(w.toLowerCase()));
  }
  
  /**
   * 从 SKILL.md 的 description 字段提取触发词
   */
  extractTriggersFromDescription(description: string): string[] {
    // 匹配 "触发词：xxx" 或 "触发词: xxx" 模式
    const triggerMatch = description.match(/触发词[：:]\s*([^。；\n]+)/);
    if (triggerMatch) {
      return triggerMatch[1]
        .split(/[,，、]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
    }
    
    return [];
  }
}