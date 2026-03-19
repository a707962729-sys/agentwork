# AgentWork Web 管理前端

为一人公司老板创建的可视化管理界面，用于管理 AgentWork 系统。

## 🚀 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **TailwindCSS** - 样式框架
- **React Router** - 路由管理
- **React Query** - 数据请求和缓存
- **WebSocket** - 实时通信
- **Zustand** - 状态管理

## 📦 功能特性

### 1. 仪表盘 (Dashboard)
- 今日任务统计
- 进行中任务数量
- Agent 活跃状态
- 成功率统计
- 快速操作入口

### 2. 任务管理 (Tasks)
- 任务列表（支持筛选、搜索）
- 任务创建对话框
- 任务详情页面
- 实时进度显示
- 步骤执行状态
- 任务控制（暂停、继续、取消）

### 3. 技能管理 (Skills)
- 已安装技能列表
- 技能安装（本地/npm/ClawHub）
- 技能详情和文档
- 技能搜索

### 4. 工作流管理 (Workflows)
- 工作流列表
- 工作流可视化
- 工作流安装
- 工作流执行

### 5. Agent 管理 (Agents)
- Agent 状态监控
- 空闲/忙碌/离线统计
- 当前任务显示
- 最后活跃时间

### 6. 对话界面 (Chat)
- 与 Coordinator 对话
- 自然语言创建任务
- 任务状态查询
- Markdown 渲染
- 代码高亮

### 7. 实时更新
- WebSocket 连接
- 任务状态实时推送
- Agent 活动通知
- 系统事件提示

### 8. 系统设置 (Settings)
- 深色/浅色主题切换
- API 地址配置
- WebSocket 地址配置
- 通知设置
- 自动刷新配置

## 🛠️ 安装和启动

### 1. 安装依赖

```bash
cd ~/Desktop/agentwork/web
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产构建

```bash
npm run preview
```

## 📁 项目结构

```
web/
├── src/
│   ├── App.tsx              # 主应用
│   ├── main.tsx             # 入口文件
│   ├── pages/               # 页面组件
│   │   ├── Dashboard.tsx    # 仪表盘
│   │   ├── Tasks.tsx        # 任务管理
│   │   ├── TaskDetail.tsx   # 任务详情
│   │   ├── Skills.tsx       # 技能管理
│   │   ├── Workflows.tsx    # 工作流管理
│   │   ├── Agents.tsx       # Agent 管理
│   │   ├── Chat.tsx         # 对话界面
│   │   └── Settings.tsx     # 系统设置
│   ├── components/          # 通用组件
│   │   ├── Layout.tsx       # 布局组件
│   │   ├── Sidebar.tsx      # 侧边栏
│   │   ├── Header.tsx       # 顶部栏
│   │   ├── TaskCard.tsx     # 任务卡片
│   │   ├── TaskProgress.tsx # 进度条
│   │   ├── SkillCard.tsx    # 技能卡片
│   │   ├── WorkflowCard.tsx # 工作流卡片
│   │   ├── ChatMessage.tsx  # 聊天消息
│   │   └── StatusBadge.tsx  # 状态徽章
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useTasks.ts      # 任务数据
│   │   ├── useSkills.ts     # 技能数据
│   │   └── useWebSocket.ts  # WebSocket
│   ├── services/            # API 服务
│   │   ├── api.ts           # REST API
│   │   └── websocket.ts     # WebSocket 服务
│   ├── store/               # 状态管理
│   │   └── appStore.ts      # Zustand store
│   └── styles/              # 样式
│       └── globals.css      # 全局样式
├── index.html               # HTML 入口
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 依赖配置
```

## 🔌 API 对接

后端 API 基地址：`http://localhost:3000/api/v1`

### 主要 API 端点

- `GET /api/v1/tasks` - 获取任务列表
- `GET /api/v1/tasks/:id` - 获取任务详情
- `POST /api/v1/tasks` - 创建任务
- `PUT /api/v1/tasks/:id` - 更新任务
- `DELETE /api/v1/tasks/:id` - 删除任务
- `POST /api/v1/tasks/:id/control` - 控制任务（暂停/继续/取消）
- `GET /api/v1/agents` - 获取 Agent 列表
- `GET /api/v1/skills` - 获取技能列表
- `POST /api/v1/skills/install` - 安装技能
- `DELETE /api/v1/skills/:name` - 卸载技能
- `GET /api/v1/workflows` - 获取工作流列表
- `POST /api/v1/workflows/:id/execute` - 执行工作流
- `POST /api/v1/chat` - 发送聊天消息
- `GET /api/v1/chat/history` - 获取聊天历史
- `GET /api/v1/system/status` - 系统状态
- `GET /api/v1/system/stats` - 系统统计

### WebSocket 连接

连接地址：`ws://localhost:3000/ws`

#### 消息格式

```typescript
// 任务更新
{ type: 'task:update'; data: Task }

// 任务创建
{ type: 'task:created'; data: Task }

// 任务完成
{ type: 'task:completed'; data: Task }

// Agent 状态
{ type: 'agent:status'; data: Agent }

// 通知
{ type: 'notification'; data: { type: string; title: string; message: string } }

// 系统事件
{ type: 'system:event'; data: any }
```

## 🎨 UI 设计

- 现代化扁平设计
- 深色/浅色主题支持
- 响应式布局（移动端适配）
- 加载状态骨架屏
- 操作确认弹窗
- 平滑动画过渡

## 📱 响应式支持

- 桌面端：完整侧边栏 + 内容区
- 平板端：可折叠侧边栏
- 移动端：汉堡菜单 + 全屏内容

## 🔧 开发指南

### 添加新页面

1. 在 `src/pages/` 创建新组件
2. 在 `src/App.tsx` 添加路由
3. 在 `src/components/Sidebar.tsx` 添加菜单项

### 添加新组件

1. 在 `src/components/` 创建组件
2. 使用 TailwindCSS 进行样式设计
3. 遵循现有组件的代码风格

### API 调用

使用 `src/services/api.ts` 中定义的 API 函数，配合 React Query 进行数据管理。

### 状态管理

使用 Zustand store (`src/store/appStore.ts`) 管理全局状态。

## 🐛 常见问题

### 1. WebSocket 连接失败

检查后端服务是否运行在 `http://localhost:3000`

### 2. API 请求失败

确认后端 API 服务已启动，检查 CORS 配置

### 3. 样式不生效

确保 TailwindCSS 已正确配置，运行 `npm install` 安装所有依赖

## 📝 许可证

MIT

## 👨‍💻 作者

AgentWork Team

---

**开始使用：**

```bash
cd ~/Desktop/agentwork/web
npm install
npm run dev
```

然后访问 http://localhost:5173 🎉
