---
name: content-review
description: "内容审核技能 - 敏感词检测、格式规范检查、输出审核报告"
metadata:
  category: content
  triggers: ["内容审核", "敏感词检测", "格式检查", "审核报告", "content review"]
  author: agentwork
  version: "1.0.0"
---

# 内容审核技能 (content-review)

## 功能

本技能提供全面的内容审核能力，包括：

1. **敏感词检测**
   - 政治敏感词过滤
   - 色情低俗内容识别
   - 暴力恐怖内容检测
   - 广告营销词识别
   - 自定义词库支持

2. **格式规范检查**
   - 标题格式验证
   - 段落结构检查
   - 标点符号规范
   - 错别字检测
   - 链接有效性验证

3. **审核报告输出**
   - 问题分级（严重/警告/建议）
   - 详细问题列表
   - 修改建议
   - 合规性评分

## 使用方法

### 基本用法

```bash
# 审核文本内容
content-review --text "待审核的文本内容"

# 审核文件
content-review --file article.md

# 生成详细报告
content-review --file article.md --output report.json
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--text` | 直接输入待审核文本 | - |
| `--file` | 指定待审核文件路径 | - |
| `--output` | 输出报告文件路径 | stdout |
| `--format` | 输出格式 (text/json/html) | text |
| `--strict` | 严格模式，更多警告 | false |
| `--skip` | 跳过某类检查 (comma 分隔) | - |

### 检查类别

- `sensitive` - 敏感词检测
- `format` - 格式规范
- `spelling` - 错别字
- `links` - 链接检查

## 输入输出

### 输入

- 文本字符串（通过 `--text` 参数）
- 文件路径（通过 `--file` 参数，支持 md/txt/html）

### 输出

**文本格式示例：**

```
═══════════════════════════════════════
内容审核报告
═══════════════════════════════════════

综合评分：85/100 ✅

【严重问题】0 个
【警告】2 个
【建议】3 个

───────────────────────────────────────
警告
───────────────────────────────────────
1. [敏感词] 第 3 段发现疑似敏感词"xxx"，建议替换
2. [格式] 标题长度超过 30 字，建议精简

───────────────────────────────────────
建议
───────────────────────────────────────
1. [拼写] "的/得/地"使用建议检查（第 5 段）
2. [格式] 段落之间建议增加空行
3. [链接] 发现 2 个外部链接，建议验证有效性

═══════════════════════════════════════
```

**JSON 格式示例：**

```json
{
  "score": 85,
  "level": "pass",
  "issues": {
    "critical": [],
    "warning": [
      {
        "type": "sensitive",
        "position": "paragraph:3",
        "message": "发现疑似敏感词",
        "suggestion": "建议替换为 xxx"
      }
    ],
    "suggestion": []
  },
  "summary": {
    "totalWords": 1250,
    "totalParagraphs": 8,
    "totalLinks": 2
  }
}
```

## 示例

### 示例 1：快速审核文本

```bash
content-review --text "这是一篇关于产品发布的文章..."
```

### 示例 2：审核文章并输出 JSON 报告

```bash
content-review --file blog-post.md --output review.json --format json
```

### 示例 3：仅检查敏感词

```bash
content-review --file article.md --skip format,spelling,links
```

### 示例 4：严格模式审核

```bash
content-review --file content.md --strict
```

## 配置

创建 `~/.content-review/config.json` 自定义词库和规则：

```json
{
  "customSensitiveWords": ["自定义敏感词"],
  "allowedDomains": ["example.com"],
  "titleMaxLength": 30,
  "paragraphMinLength": 10
}
```
