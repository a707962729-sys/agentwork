---
name: article-outline
description: "文章大纲设计技能 - 根据主题生成结构化文章大纲"
metadata:
  category: content
  triggers: ["大纲", "提纲", "文章结构", "outline", "大纲设计"]
  author: agentwork
  version: "1.0.0"
---

# 文章大纲设计技能

## 功能
根据主题和上下文，生成结构化的文章大纲。

## 使用场景
- 需要规划文章结构
- 需要明确写作方向
- 需要分解复杂主题

## 输入参数
- `topic`: 文章主题（必填）
- `platform`: 目标平台（可选：小红书/微信公众号/知乎等）
- `context`: 背景资料（可选）
- `style`: 写作风格（可选：专业/轻松/幽默）

## 输出格式
```json
{
  "title": "文章标题建议",
  "summary": "文章摘要",
  "sections": [
    {
      "id": "section-1",
      "title": "章节标题",
      "points": ["要点1", "要点2"]
    }
  ],
  "estimatedWordCount": 1000,
  "keywords": ["关键词1", "关键词2"]
}
```