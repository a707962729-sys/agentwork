---
name: web-search
description: "网络搜索技能 - 搜索互联网获取信息"
metadata:
  category: research
  triggers: ["搜索", "查找", "调研", "搜索资料", "查一下"]
  author: agentwork
  version: "1.0.0"
---

# 网络搜索技能

## 功能
搜索互联网获取相关信息，支持多种搜索引擎。

## 使用场景
- 需要查找最新资讯
- 需要验证信息
- 需要收集资料
- 需要调研市场

## 输入参数
- `query`: 搜索关键词（必填）
- `count`: 返回结果数量（可选，默认10）
- `freshness`: 时间范围（可选：day/week/month）

## 输出格式
```json
{
  "results": [
    {
      "title": "结果标题",
      "url": "https://...",
      "snippet": "摘要内容",
      "source": "来源网站"
    }
  ],
  "total": 10,
  "query": "搜索关键词"
}
```