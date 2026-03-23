---
name: wechat-publish
description: 微信公众号发布技能。文章发布、图片上传、草稿管理、定时发布。触发词：公众号发布、微信发布、发布文章、公众号、wechat publish、微信公众号、发公众号。支持 Markdown 转换、自动排版、素材管理。
dependency:
  api: "微信公众号 API (appId + appSecret)"
---

# 微信公众号发布技能

微信公众号内容发布的全流程能力。

## 工作流程

1. **解析内容** - 读取 Markdown 文件
2. **格式转换** - 转为微信公众号格式
3. **上传素材** - 图片上传到素材库
4. **创建草稿** - 保存到草稿箱
5. **发布/定时** - 发布或定时发布

## 主要功能

| 功能 | 说明 |
|------|------|
| 文章发布 | Markdown → 微信格式 |
| 图片上传 | 自动上传到素材库 |
| 草稿管理 | 创建/查看/删除草稿 |
| 定时发布 | 设置定时发布时间 |

## 输入参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `file` | 是 | Markdown 文件路径 |
| `title` | 否 | 文章标题 |
| `draft` | 否 | 仅保存草稿 |
| `schedule` | 否 | 定时发布时间 |

## 详细参考

- Markdown 格式规范：`references/markdown-format.md`
- 微信公众号限制：`references/wechat-limits.md`

## 输出模板

输出格式详见：`templates/publish-result.md`