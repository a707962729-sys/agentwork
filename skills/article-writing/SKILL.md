---
name: article-writing
description: "文章写作技能 - 支持多种文体和风格的文章创作"
metadata:
  category: content
  triggers: ["写文章", "撰写", "写作", "创作内容", "写一篇"]
  author: agentwork
  version: "1.0.0"
---

# 文章写作技能

## 功能
根据主题和要求，撰写高质量的文章内容。

## 支持的文章类型
- 科普文章
- 技术博客
- 商业分析
- 新闻资讯
- 观点评论

## 使用方法
1. 确定文章主题和目标读者
2. 生成大纲供用户确认
3. 按大纲撰写正文
4. 提供修改建议

## 输入参数
- `topic`: 文章主题（必填）
- `style`: 写作风格（可选：专业/轻松/幽默）
- `length`: 目标字数（可选，默认800）
- `outline`: 大纲内容（可选）

## 输出格式
```json
{
  "title": "文章标题",
  "summary": "文章摘要",
  "content": "正文内容（Markdown格式）",
  "wordCount": 1234,
  "sections": ["章节1", "章节2"]
}
```