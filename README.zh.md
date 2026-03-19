# AgentWork - 一人公司自动化平台

基于 OpenClaw 网关模式的一人公司自动化平台，支持技能组合和工作流定制。

[English](./README.md) | 中文

## ✨ 特性

- **Skills 完全兼容 OpenClaw** - 可直接安装使用 OpenClaw 技能
- **Workflow 工作流系统** - YAML 定义，可安装/卸载/分享
- **Checkpoint 检查点** - 每个节点验证，确保质量
- **顺序流水线执行** - 可控可追溯
- **Agent 多角色协作** - 支持多个 AI Agent 协同工作

## 📦 安装

### 环境要求

- Node.js >= 18
- npm 或 yarn

### 安装步骤

```bash
# 克隆或进入项目目录
cd ~/Desktop/agentwork

# 安装依赖
npm install

# 构建项目
npm run build

# 验证安装
npm run cli -- --version
```

### (可选) OpenClaw 集成

AgentWork 完全兼容 OpenClaw 技能系统。如果已安装 OpenClaw：

```bash
# AgentWork 会自动加载以下目录的技能：
# - ./skills/ (本地技能)
# - ~/.openclaw/skills/ (OpenClaw 技能)
```

## 🚀 快速开始

### 创建第一个任务

```bash
# 创建任务
npm run cli -- task create "写一篇关于 AI 的文章" -t content

# 查看任务
npm run cli -- task show <task-id>

# 执行任务
npm run cli -- task run <task-id>
```

### 运行工作流

```bash
# 列出可用工作流
npm run cli -- workflow list

# 运行工作流
npm run cli -- workflow run content-publish --param topic="AI Agent" --param style="专业"
```

### 管理技能

```bash
# 列出已安装技能
npm run cli -- skill list

# 安装新技能
npm run cli -- skill install ./skills/my-skill

# 搜索技能
npm run cli -- skill search "写作"
```

## 📂 目录结构

```
agentwork/
├── src/
│   ├── orchestrator/    # 任务编排器
│   ├── workflow/        # 工作流引擎
│   ├── skills/          # 技能注册中心
│   ├── db/              # 数据库
│   ├── types.ts         # 类型定义
│   ├── utils.ts         # 工具函数
│   ├── index.ts         # 入口
│   └── cli.ts           # CLI 命令
├── skills/              # 内置技能
│   ├── task-decompose/  # 任务拆解
│   ├── article-writing/ # 文章写作
│   └── web-search/      # 网络搜索
├── workflows/           # 工作流定义
│   ├── content-publish.yaml  # 内容发布流程
│   └── dev-pipeline.yaml     # 开发流水线
├── agents/              # Agent 配置
│   ├── coordinator.yaml      # 协调者
│   ├── content-writer.yaml   # 内容创作者
│   └── developer.yaml        # 开发者
├── docs/                # 文档
│   ├── getting-started.md    # 快速开始
│   ├── skills.md             # 技能开发指南
│   ├── workflows.md          # 工作流定义指南
│   ├── agents.md             # Agent 配置指南
│   └── api.md                # API 参考
├── examples/            # 示例
│   ├── basic-task.md         # 基础任务示例
│   ├── content-workflow.md   # 内容工作流示例
│   └── custom-skill.md       # 自定义技能示例
├── config.yaml          # 平台配置
├── package.json
└── README.md
```

## 📖 使用示例

### 示例 1：内容创作

```bash
# 运行内容发布工作流
npm run cli -- workflow run content-publish \
  --param topic="AI 技术详解" \
  --param style="专业" \
  --param auto_publish=true
```

### 示例 2：开发流水线

```bash
# 运行开发流水线
npm run cli -- workflow run dev-pipeline \
  --param repo="my-project" \
  --param branch="main"
```

### 示例 3：自定义任务

```bash
# 创建自定义任务
npm run cli -- task create "分析市场趋势" -t research -d "研究 AI 行业最新发展"

# 查看执行进度
npm run cli -- task show <task-id>
```

## 🔧 技能格式

兼容 OpenClaw SKILL.md 格式：

```markdown
---
name: my-skill
description: "技能描述"
metadata:
  category: content
  triggers: ["触发词"]
  author: your-name
  version: "1.0.0"
---

# 技能说明

## 功能
技能功能描述

## 输入参数
- `param1`: 参数说明（必填/选填）
- `param2`: 参数说明（必填/选填）

## 输出格式
```json
{
  "field": "说明"
}
```

## 使用示例
```bash
npm run cli -- skill run my-skill --param key=value
```
```

## 📋 工作流格式

```yaml
apiVersion: company/v1
kind: Workflow

metadata:
  id: my-workflow
  name: "工作流名称"
  description: "工作流描述"
  version: "1.0.0"

inputs:
  param1:
    type: string
    required: true
    description: "参数说明"

steps:
  - id: step1
    name: "步骤名称"
    skill: skill-name
    agent: agent-id  # 可选
    input:
      key: "${inputs.param1}"
    checkpoint:
      validate: "output.success == true"
      onError: retry
      maxRetries: 2

outputs:
  result: "${steps.step1.output}"
```

## 🤖 Agent 配置

```yaml
# agents/my-agent.yaml
id: my-agent
name: "Agent 名称"
description: "Agent 描述"

model: qwen-cn/qwen3.5-plus

skills:
  - skill-1
  - skill-2

tools:
  allow: [read, write, web_search]
  deny: [exec]

persona:
  tone: "professional"
  style: "专业、高效"
  expertise: ["领域 1", "领域 2"]
```

## 🔗 与 OpenClaw 集成

AgentWork 完全兼容 OpenClaw 技能系统：

```typescript
import { getAgentWork } from 'agentwork';

const app = await getAgentWork();

// 使用 OpenClaw 技能
const skills = app.getSkillsRegistry();
// 自动加载 ~/.openclaw/skills 目录下的技能
```

## 📚 文档

- [快速开始指南](./docs/getting-started.md) - 安装和入门
- [技能开发指南](./docs/skills.md) - 创建自定义技能
- [工作流定义指南](./docs/workflows.md) - 定义自动化流程
- [Agent 配置指南](./docs/agents.md) - 配置 AI Agent
- [API 参考](./docs/api.md) - 完整 API 文档

## 💡 示例

- [基础任务示例](./examples/basic-task.md) - 创建和执行任务
- [内容工作流示例](./examples/content-workflow.md) - 完整内容创作流程
- [自定义技能示例](./examples/custom-skill.md) - 从零创建技能

## 🛠️ 开发

### 开发模式

```bash
# 监听模式编译
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

### 添加新技能

```bash
# 创建技能目录
mkdir -p skills/my-skill

# 创建 SKILL.md
cat > skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: "我的技能"
metadata:
  category: content
  triggers: ["触发词"]
---

# 技能说明
...
EOF

# 安装技能
npm run cli -- skill install ./skills/my-skill
```

### 添加新工作流

```bash
# 创建工作流文件
cat > workflows/my-workflow.yaml << 'EOF'
apiVersion: company/v1
kind: Workflow

metadata:
  id: my-workflow
  name: "我的工作流"

inputs:
  param1:
    type: string
    required: true

steps:
  - id: step1
    skill: my-skill
    input:
      key: "${inputs.param1}"
EOF

# 运行工作流
npm run cli -- workflow run my-workflow --param param1="value"
```

## 🆘 常见问题

### 构建失败

```bash
# 清理并重新构建
rm -rf dist/ node_modules/
npm install
npm run build
```

### 技能未找到

- 检查 SKILL.md 语法
- 确保技能目录在 `skills/` 下
- 运行 `npm run cli -- skill list` 确认已安装

### 工作流执行失败

- 检查 YAML 语法
- 确认引用的技能已安装
- 查看错误日志定位问题

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**一人公司，无限可能** 🚀
