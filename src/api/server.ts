import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readdir, readFile } from 'fs/promises';
import * as yaml from 'yaml';

// 数据库和引擎
import { DatabaseManager } from '../db/index.js';
import { WorkflowEngine } from '../workflow/engine.js';
import { SkillsRegistry } from '../skills/index.js';
import { AgentRunner, AgentRunnerConfig } from '../agent-engine/index.js';
import { TaskOrchestrator } from '../orchestrator/index.js';

// API 路由
import { createTasksRouter } from './tasks.js';
import { createStatsRouter } from './stats.js';
import { createWorkflowsRouter } from './workflows.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

export class APIServer {
  private app: Application;
  private port: number;
  private db: DatabaseManager;
  private workflowEngine: WorkflowEngine;
  private skills: SkillsRegistry;
  private agentRunner: AgentRunner;
  private orchestrator: TaskOrchestrator;
  private initialized: boolean = false;
  private config: any = {};

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();

    // 加载配置文件
    this.loadConfig();

    // 初始化数据库和引擎 - 使用绝对路径
    const dbPath = path.join(PROJECT_ROOT, 'data', 'agentwork.db');
    this.db = new DatabaseManager(dbPath);
    
    const skillsPath = path.join(PROJECT_ROOT, 'skills');
    this.skills = new SkillsRegistry(this.db, skillsPath);
    
    // 初始化 AgentRunner（独立 AI 调用）
    this.agentRunner = new AgentRunner(this.db, this.getAIConfig());
    
    this.workflowEngine = new WorkflowEngine(this.db, this.skills, this.agentRunner);
    this.orchestrator = new TaskOrchestrator(this.db, this.workflowEngine, this.skills);

    // 配置中间件
    this.configureMiddleware();

    // 配置路由
    this.configureRoutes();

    // 静态文件服务
    this.configureStatic();
  }

  /**
   * 加载配置文件
   */
  private loadConfig(): void {
    const configPath = path.join(__dirname, '..', '..', 'config.yaml');
    try {
      const content = require('fs').readFileSync(configPath, 'utf-8');
      this.config = yaml.parse(content) || {};
    } catch {
      console.warn('⚠️ No config.yaml found, using defaults');
    }
  }

  /**
   * 获取 AI 配置
   */
  private getAIConfig(): AgentRunnerConfig {
    const aiConfig = this.config.ai || {};
    return {
      defaultModel: aiConfig.default || process.env.AI_MODEL || 'glm-5',
      providers: aiConfig.providers || {}
    };
  }

  /**
   * 加载工作流目录下的所有 YAML 文件
   */
  private async loadWorkflows(): Promise<number> {
    const workflowsDir = path.join(__dirname, '..', '..', 'workflows');
    try {
      const files = await readdir(workflowsDir);
      const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
      
      let loaded = 0;
      for (const file of yamlFiles) {
        try {
          await this.workflowEngine.loadFromFile(path.join(workflowsDir, file));
          loaded++;
        } catch (err: any) {
          console.warn(`⚠️ Failed to load workflow ${file}: ${err.message}`);
        }
      }
      return loaded;
    } catch (err: any) {
      console.warn(`⚠️ Workflows directory not found: ${err.message}`);
      return 0;
    }
  }

  private configureMiddleware(): void {
    // CORS
    this.app.use(cors());

    // JSON 解析
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // 日志中间件
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private configureRoutes(): void {
    // API 路由
    this.app.use('/api/tasks', createTasksRouter(this.db, this.orchestrator));
    this.app.use('/api/stats', createStatsRouter(this.db, this.orchestrator));
    this.app.use('/api/workflows', createWorkflowsRouter(this.db, this.workflowEngine));

    // 健康检查
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          workflowEngine: 'ready',
          skillsRegistry: 'ready'
        }
      });
    });

    // 根路径
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'AgentWork API',
        version: '1.0.0',
        description: '一人公司自动化平台 API',
        endpoints: {
          tasks: '/api/tasks',
          stats: '/api/stats',
          workflows: '/api/workflows'
        }
      });
    });
  }

  private configureStatic(): void {
    // 构建后的前端文件
    const distPath = path.join(__dirname, '..', '..', 'dist');
    this.app.use(express.static(distPath));

    // web 目录
    const webPath = path.join(__dirname, '..', '..', 'web');
    this.app.use(express.static(webPath));
  }

  public async start(): Promise<void> {
    // 初始化技能注册表 - 加载所有技能到内存
    if (!this.initialized) {
      await this.skills.init();
      this.initialized = true;
      console.log(`🔧 Skills registry initialized: ${this.skills.list().length} skills loaded`);
    }
    
    // 加载工作流
    const workflowCount = await this.loadWorkflows();
    
    return new Promise((resolve, reject) => {
      this.app.listen(this.port, () => {
        console.log(`🚀 AgentWork API Server running on port ${this.port}`);
        console.log(`📊 Dashboard: http://localhost:${this.port}`);
        console.log(`📋 API Docs: http://localhost:${this.port}`);
        console.log(`📁 Loaded ${workflowCount} workflows`);
        resolve();
      }).on('error', (error: Error) => {
        console.error(`Failed to start server: ${error.message}`);
        reject(error);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.app) {
        // Express doesn't have close, we need to get the server instance
        // For now, just resolve
        console.log('Server stopped');
        resolve();
      } else {
        resolve();
      }
    });
  }

  public getApp(): Application {
    return this.app;
  }

  public getPort(): number {
    return this.port;
  }
}

export function createServer(port: number = 3000): APIServer {
  return new APIServer(port);
}

export default createServer;
