/**
 * AgentWork API Server
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 导入核心模块 (从父目录的 dist)
import { DatabaseManager } from '../../dist/db/index.js';
import { WorkflowEngine } from '../../dist/workflow/engine.js';
import { SkillsRegistry } from '../../dist/skills/index.js';
import { TaskOrchestrator } from '../../dist/orchestrator/index.js';

// 导入路由
import tasksRouter from './routes/tasks.js';
import skillsRouter from './routes/skills.js';
import workflowsRouter from './routes/workflows.js';
import agentsRouter from './routes/agents.js';
import employeesRouter from './routes/employees.js';
import chatRouter from './routes/chat.js';
import assetsRouter from './routes/assets.js';
import statsRouter from './routes/stats.js';
import modelsRouter from './routes/models.js';
import { createExecuteRouter } from '../../src/executor/routes-execute.js';
import { ExecutorOrchestrator } from '../../src/executor/index.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']
}));
app.use(express.json());

// 初始化核心模块
// 项目根目录
const projectRoot = join(__dirname, '..', '..');
const dbPath = join(projectRoot, 'data', 'agentwork.db');
const skillsDir = join(projectRoot, 'skills');
const workflowsDir = join(projectRoot, 'workflows');

const db = new DatabaseManager(dbPath);
const skills = new SkillsRegistry(db, skillsDir);
const workflowEngine = new WorkflowEngine(db, skills);
const orchestrator = new TaskOrchestrator(db, workflowEngine, skills);

// 初始化技能
await skills.init();

// 加载工作流
import { readdir } from 'fs/promises';
try {
  const files = await readdir(workflowsDir);
  for (const file of files) {
    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      await workflowEngine.loadFromFile(join(workflowsDir, file));
    }
  }
} catch {
  // 工作流目录可能不存在
}

// 将核心模块注入到 app.locals
app.locals.db = db;
app.locals.skills = skills;
app.locals.workflowEngine = workflowEngine;
app.locals.orchestrator = orchestrator;
app.locals.io = io;

// 初始化 Executor Orchestrator
const executorOrchestrator = new ExecutorOrchestrator();
await executorOrchestrator.init(dbPath);
executorOrchestrator.start();
app.locals.executor = executorOrchestrator;

// API 路由
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/skills', skillsRouter);
app.use('/api/v1/workflows', workflowsRouter);
app.use('/api/v1/agents', agentsRouter);
app.use('/api/v1/employees', employeesRouter);
// 初始化聊天记录数据库
const { initChatDb } = await import('./routes/chat.js');
initChatDb(dbPath);
app.locals.chatDbPath = dbPath;

app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/assets', assetsRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/models', modelsRouter);
app.use('/api/v1/execute', (req, res, next) => {
  (req as any).app = { locals: { executor: executorOrchestrator } };
  createExecuteRouter({ orchestrator: executorOrchestrator })(req, res, next);
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket 连接
io.on('connection', (socket) => {
  console.log(`[WS] 客户端连接: ${socket.id}`);

  // 订阅任务更新
  socket.on('subscribe:task', (taskId: string) => {
    socket.join(`task:${taskId}`);
    console.log(`[WS] 订阅任务: ${taskId}`);
  });

  // 取消订阅
  socket.on('unsubscribe:task', (taskId: string) => {
    socket.leave(`task:${taskId}`);
  });

  // 订阅所有任务
  socket.on('subscribe:tasks', () => {
    socket.join('tasks');
  });

  socket.on('disconnect', () => {
    console.log(`[WS] 客户端断开: ${socket.id}`);
  });
});

// 监听任务事件并广播
orchestrator.on('task:created', (event) => {
  io.to('tasks').emit('task:created', event);
});

orchestrator.on('task:started', (event) => {
  io.to('tasks').emit('task:started', event);
  io.to(`task:${event.data.taskId}`).emit('task:updated', event);
});

orchestrator.on('task:completed', (event) => {
  io.to('tasks').emit('task:completed', event);
  io.to(`task:${event.data.taskId}`).emit('task:updated', event);
});

orchestrator.on('step:started', (event) => {
  io.to(`task:${event.data.taskId}`).emit('step:started', event);
});

orchestrator.on('step:completed', (event) => {
  io.to(`task:${event.data.taskId}`).emit('step:completed', event);
});

// 启动服务器
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 AgentWork API Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket enabled`);
  console.log(`📚 API docs: http://localhost:${PORT}/api/health`);
});

export { app, io, db, skills, workflowEngine, orchestrator };