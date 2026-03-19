# AgentWork Plugin 安装指南

将 AgentWork 安装为 OpenClaw Plugin，实现任务编排和自动化能力。

## 前置要求

- Node.js >= 18
- OpenClaw 已安装并配置
- npm 或 pnpm 包管理器

## 安装方式

### 方式一：本地安装（推荐开发使用）

```bash
# 进入 AgentWork 项目目录
cd ~/Desktop/agentwork

# 安装依赖
npm install

# 构建插件
npm run build

# 在 OpenClaw 中安装本地插件
openclaw plugins install ~/Desktop/agentwork
```

### 方式二：从 npm 安装

```bash
# 如果已发布到 npm
openclaw plugins install agentwork
```

### 方式三：从 Git 仓库安装

```bash
# 从 GitHub 安装
openclaw plugins install github:yourusername/agentwork
```

## 配置

安装完成后，在 OpenClaw 配置文件中添加：

```yaml
# ~/.openclaw/config.yaml
plugins:
  entries:
    agentwork:
      enabled: true
      config:
        workspace: ~/Desktop/agentwork/data
        defaultModel: qwen-cn/glm-5
```

### 配置项说明

| 配置项 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| `workspace` | string | AgentWork 数据目录路径 | `~/agentwork-data` |
| `defaultModel` | string | 默认使用的 AI 模型 | `qwen-cn/glm-5` |

## 验证安装

### 检查插件状态

```bash
openclaw plugins list
```

应该能看到 `agentwork` 在已安装插件列表中。

### 使用 CLI 命令

```bash
# 创建任务
openclaw agentwork create "分析市场趋势并生成报告"

# 查看任务列表
openclaw agentwork list

# 查询任务状态
openclaw agentwork status <task-id>
```

### 使用 HTTP API

```bash
# 创建任务
curl -X POST http://localhost:8080/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"task": "分析市场趋势", "options": {"priority": "high"}}'

# 查询任务
curl http://localhost:8080/api/v1/tasks/<task-id>

# 列出所有任务
curl http://localhost:8080/api/v1/tasks
```

## 可用的 Skills

安装后，以下 Skills 将自动加载：

- `skills/task-decompose` - 任务分解技能
- `skills/article-writing` - 文章撰写技能
- `skills/web-search` - 网络搜索技能

使用示例：

```yaml
# 在 OpenClaw 会话中使用
/tasks/decompose "写一篇关于 AI 发展趋势的文章"
```

## 可用的 Tools

插件注册了以下工具：

| 工具 ID | 说明 |
|---------|------|
| `agentwork.decompose` | 将复杂任务分解为可执行的子任务 |
| `agentwork.execute` | 执行已分解的子任务 |
| `agentwork.status` | 查询任务执行状态 |

## 卸载

```bash
openclaw plugins uninstall agentwork
```

## 故障排查

### 插件未加载

1. 检查 `openclaw.plugins.list` 中是否包含 `agentwork`
2. 确认 `openclaw.plugin.json` 文件存在且格式正确
3. 查看 OpenClaw 日志：`openclaw logs`

### 构建失败

```bash
# 清理并重新构建
rm -rf dist
npm install
npm run build
```

### 配置验证失败

```bash
# 验证配置文件
openclaw doctor
```

## 开发模式

在开发过程中，可以使用 watch 模式：

```bash
# 监听 TypeScript 变化
npm run dev

# 重启 OpenClaw 以重新加载插件
openclaw gateway restart
```

## 更多信息

- [OpenClaw Plugin 文档](~/work/node_modules/openclaw/docs/plugins/manifest.md)
- [AgentWork README](./README.md)

## 许可证

MIT
