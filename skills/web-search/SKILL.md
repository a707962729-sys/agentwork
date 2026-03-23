---
name: web-search
description: 网络搜索技能。搜索互联网获取信息，支持时间过滤、来源筛选、结果聚合。触发词：搜索、查找、调研、搜索资料、查一下、帮我搜、找找看。适用于：最新资讯、事实查证、市场调研、技术文档查找。
dependency:
  api: "搜索 API (Brave/Google/Bing)"
---

# 网络搜索技能

搜索互联网获取相关信息，支持多种搜索引擎和过滤条件。

## 工作流程

1. **理解需求** - 分析搜索意图，提取关键词
2. **构建查询** - 优化搜索词，添加限定词
3. **执行搜索** - 调用搜索 API 获取结果
4. **筛选整理** - 按相关性、时效性过滤
5. **汇总输出** - 结构化呈现结果

## 输入参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `query` | 是 | 搜索关键词 |
| `count` | 否 | 返回结果数量，默认 10 |
| `freshness` | 否 | 时间范围：day/week/month/year |
| `source` | 否 | 来源限定：news/blog/docs |
| `region` | 否 | 地区限定：cn/us/global |

## 详细参考

- 搜索技巧：`references/search-tips.md`
- 高级查询语法：`references/query-syntax.md`

## 输出模板

输出格式详见：`templates/search-result.md`