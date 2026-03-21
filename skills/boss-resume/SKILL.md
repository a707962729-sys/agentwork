# Boss直聘简历搜索技能

## 概述

通过真实 Chrome 浏览器在 Boss直聘上搜索符合条件的简历，支持多条件筛选、批量导出到指定文件夹。使用 Chrome CDP 协议绕过反爬虫检测，保持人工监督的半自动化流程。

## 触发词

- "搜索简历"
- "Boss简历"
- "找候选人"
- "简历导出"
- "boss-resume"

## 功能特性

| 功能 | 描述 |
|------|------|
| 条件搜索 | 职位关键词、地点、学历、经验、薪资等 |
| 简历预览 | 自动截取关键信息 |
| 批量导出 | 支持导出到指定文件夹，Markdown/JSON/CSV 多格式 |
| 去重处理 | 避免重复收集同一候选人 |
| 进度记录 | 支持断点续搜 |

## 使用示例

### 基础搜索

```bash
# 搜索前端工程师
bun run ~/.openclaw/extensions/agentwork/skills/boss-resume/scripts/main.ts "前端工程师"

# 搜索 + 筛选条件
bun run ~/.openclaw/extensions/agentwork/skills/boss-resume/scripts/main.ts "前端工程师" \
  --city "北京" \
  --experience "3-5年" \
  --education "本科" \
  --salary "20k-40k"
```

### 导出选项

```bash
# 导出到指定目录
bun run ~/.openclaw/extensions/agentwork/skills/boss-resume/scripts/main.ts "产品经理" --output-dir ./resumes/

# 指定导出格式
bun run ~/.openclaw/extensions/agentwork/skills/boss-resume/scripts/main.ts "产品经理" --format json

# 批量导出当前搜索结果（需人工确认）
bun run ~/.openclaw/extensions/agentwork/skills/boss-resume/scripts/main.ts "产品经理" --export-all
```

## 命令行参数

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--city` | `-c` | 城市 | - |
| `--experience` | `-e` | 工作经验 | - |
| `--education` | `-edu` | 学历要求 | - |
| `--salary` | `-s` | 薪资范围 | - |
| `--output-dir` | `-o` | 导出目录 | `./resumes/` |
| `--format` | `-f` | 导出格式 (markdown/json/csv) | `markdown` |
| `--export-all` | - | 导出当前页全部结果 | `false` |
| `--limit` | `-l` | 最大导出数量 | `50` |
| `--headless` | - | 无头模式（不推荐） | `false` |

## 技术架构

```
~/.openclaw/extensions/agentwork/skills/boss-resume/
├── SKILL.md                 # 技能说明文档
├── EXTEND.md                # 用户偏好配置（首次运行生成）
├── scripts/
│   ├── main.ts              # CLI 入口
│   ├── search.ts            # 搜索逻辑
│   ├── export.ts            # 导出逻辑
│   ├── dedup.ts             # 去重逻辑
│   └── lib/
│       ├── browser.ts       # 浏览器控制
│       ├── parser.ts        # 页面解析
│       └── types.ts         # 类型定义
├── references/
│   ├── workflow.md          # 工作流程详解
│   └── anti-detection.md    # 反爬虫应对策略
└── profile/                 # Chrome Profile 隔离目录
    └── .gitkeep
```

## 依赖要求

| 依赖 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0.0 | 或 Bun >= 1.0 |
| Bun | >= 1.0.0 | 推荐运行时 |
| Chrome/Chromium | 最新版 | 需要图形界面 |

## 账号要求

- Boss直聘企业账号（需企业认证）
- 有效会员（部分高级搜索功能需要付费会员）
- 联系方式查看权限（部分联系方式需要额外购买或权限）

## ⚠️ 重要提示

首次运行时会显示使用条款：

```
⚠️  重要提示

本技能仅供辅助搜索和整理简历信息，请遵守以下规则:

1. 您需要持有有效的 Boss直聘企业账号
2. 请勿用于大规模批量采集
3. 请勿绕过平台付费功能
4. 打招呼和联系候选人请人工确认
5. 使用本技能的一切后果由您自行承担

继续使用即表示您已阅读并同意以上条款。
```

## 平台限制与合规

| 限制 | 应对策略 |
|------|----------|
| 每日搜索次数限制 | 记录使用量，提醒用户 |
| 简历查看次数限制 | 智能缓存，避免重复查看 |
| 打招呼次数限制 | 不自动打招呼，保持人工控制 |
| 反爬虫检测 | 随机延迟、隐藏自动化特征 |

## 反爬虫应对

| 检测点 | 应对方案 |
|--------|----------|
| WebDriver 属性 | 移除 `navigator.webdriver`，注入脚本伪装 |
| 自动化特征 | 禁用 `AutomationControlled` 特性 |
| 行为模式 | 随机延迟、模拟人类滚动和点击 |
| 请求频率 | 限制每页停留时间（5-15秒），避免过快翻页 |
| 验证码 | 检测验证码页面，暂停并提示用户手动处理 |

## 输出格式

### Markdown 模板

```markdown
---
id: "{{resume.id}}"
name: "{{resume.name}}"
captured_at: "{{timestamp}}"
source: "Boss直聘"
---

# {{resume.name}}

## 基本信息
- **职位**: {{resume.title}}
- **当前公司**: {{resume.company}}
- **学历**: {{resume.education}}
- **经验**: {{resume.experience}}
- **期望薪资**: {{resume.salary}}
- **地点**: {{resume.location}}

## 工作经历
{{#each resume.workExperience}}
- **{{this.company}}** ({{this.startDate}} - {{this.endDate}})
  - {{this.position}}
  - {{this.description}}
{{/each}}

## 技能标签
{{resume.skills}}

## 求职意向
- **期望职位**: {{resume.expectedPosition}}
- **期望薪资**: {{resume.expectedSalary}}
- **期望地点**: {{resume.expectedLocation}}

---
> 采集时间: {{captured_at}}
> 来源: Boss直聘
```

## 参考文档

- [工作流程详解](./references/workflow.md)
- [反爬虫应对策略](./references/anti-detection.md)

## 更新日志

### v1.0.0 (2024-03-20)
- 初始版本
- 支持基础搜索和多条件筛选
- 支持 Markdown/JSON/CSV 导出
- 支持本地去重索引