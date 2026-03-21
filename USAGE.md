# AgentWork 使用指南

## 快速启动

```bash
cd ~/.openclaw/extensions/agentwork
./start.sh
```

启动后访问：
- **Dashboard**: http://localhost:5173
- **API**: http://localhost:3000

## 停止服务

```bash
./stop.sh
```

## 内置工作流（12套）

| ID | 名称 | 适用场景 |
|----|------|----------|
| content-creator | 自媒体创作者 | 小红书/抖音内容 |
| indie-developer | 独立开发者 | SaaS 产品开发 |
| ecommerce-seller | 电商卖家 | 店铺运营 |
| consultant | 知识付费/咨询 | 在线课程/咨询 |
| freelance-writer | 自由撰稿人 | 接稿写文章 |
| social-media-manager | 社媒代运营 | 企业账号代运营 |
| course-creator | 在线课程制作 | 销售在线课程 |
| newsletter-author | 付费订阅 | Newsletter |
| ai-tool-maker | AI 工具开发者 | AI 小工具 |
| translation-service | 翻译服务 | 翻译接单 |
| content-publish | 内容发布 | 通用内容发布 |
| dev-pipeline | 开发流水线 | 代码开发流程 |

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| /health | GET | 健康检查 |
| /api/tasks | GET/POST | 任务列表/创建 |
| /api/tasks/:id | GET/PUT/DELETE | 任务详情/更新/删除 |
| /api/stats | GET | 仪表盘统计数据 |
| /api/workflows | GET | 工作流列表 |
| /api/workflows/:id | GET | 工作流详情 |
| /api/workflows/:id/run | POST | 运行工作流 |

## 运行工作流示例

```bash
# 运行自媒体创作者工作流
curl -X POST http://localhost:3000/api/workflows/content-creator/run \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"topic": "AI 办公效率提升"}}'
```

## 项目结构

```
agentwork/
├── start.sh          # 一键启动
├── stop.sh           # 停止服务
├── start-api.mjs     # API 启动入口
├── workflows/        # 工作流定义 (12套)
├── web/              # 前端代码
│   └── src/
│       ├── pages/    # 页面组件
│       └── components/ # UI 组件
├── src/
│   ├── api/          # 后端 API
│   ├── workflow/     # 工作流引擎
│   ├── agent-engine/ # Agent 执行器
│   ├── task-queue/   # 任务队列
│   └── recovery/     # 故障恢复
└── data/             # SQLite 数据库
```

## 技术栈

- **后端**: Node.js + Express + TypeScript + SQLite
- **前端**: Vite + React + ECharts
- **AI**: OpenClaw sessions_spawn 集成

---

*更新时间: 2026-03-21*