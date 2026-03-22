---
name: xiaohongshu-publish
description: "小红书发布技能 - 将内容发布到小红书平台"
metadata:
  category: content
  triggers: ["小红书发布", "发布小红书", "xhs发布", "redbook发布"]
  author: agentwork
  version: "1.0.0"
---

# 小红书发布技能

## 功能
将文章内容发布到小红书平台，支持图文笔记发布。

## 使用场景
- 需要将内容发布到小红书
- 需要生成小红书格式的笔记
- 需要管理小红书发布流程

## 输入参数
- `article`: 文章内容（必填）
- `cover`: 封面图片URL（必填）
- `platform`: 平台标识（小红书）
- `tags`: 标签列表（可选）

## 输出格式
```json
{
  "success": true,
  "postId": "笔记ID",
  "url": "https://www.xiaohongshu.com/explore/xxx",
  "publishedAt": "2024-01-15T10:00:00Z"
}
```

## 发布流程
1. 格式化内容为小红书风格
2. 上传封面图片
3. 创建草稿
4. 发布笔记
5. 返回发布结果