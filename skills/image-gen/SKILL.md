---
name: image-gen
description: 图片生成技能。封面图、配图、图标生成，支持多种风格。触发词：图片生成、封面图、配图、生成图片、image generation、cover image、帮我画、生成一张图。支持写实/插画/扁平/水彩/赛博朋克/中国风等风格。
dependency:
  api: "图片生成 API (OpenAI/DALL-E/Midjourney/Stable Diffusion)"
---

# 图片生成技能

AI 驱动的图片生成能力，支持多种场景和风格。

## 工作流程

1. **理解需求** - 分析图片描述和用途
2. **选择风格** - 根据场景推荐合适风格
3. **构建提示词** - 优化生成效果
4. **生成图片** - 调用 API 生成
5. **后处理** - 调整尺寸、格式

## 支持的风格

| 风格 | 适用场景 |
|------|----------|
| realistic | 产品展示、新闻配图 |
| illustration | 教程、故事配图 |
| flat | UI 设计、信息图 |
| watercolor | 文艺内容、博客 |
| cyberpunk | 科技、游戏内容 |
| chinese | 传统文化内容 |
| minimalist | 高端品牌、简约设计 |
| 3d | 产品展示、概念图 |

## 输入参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `prompt` | 是 | 图片描述 |
| `type` | 否 | 类型：cover/illustration/icon/background |
| `style` | 否 | 艺术风格 |
| `ratio` | 否 | 宽高比：16:9/4:3/1:1/9:16 |

## 详细参考

- 提示词技巧：`references/prompt-tips.md`
- 各平台图片规范：`references/platform-specs.md`

## 输出模板

输出格式详见：`templates/image-output.md`