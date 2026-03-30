import type { TaskOrchestrator } from '../orchestrator/index.js';
import type { WorkflowDefinition } from '../types.js';
import http from 'http';
import { Logger } from '../logging/index.js';

export interface WebhookConfig {
  path: string;
  workflowId: string;
  method?: 'GET' | 'POST';
  secret?: string;
}

export class WebhookReceiver {
  private logger = new Logger();
  private orchestrator: TaskOrchestrator;
  private webhooks: Map<string, WebhookConfig> = new Map();
  private server?: http.Server;
  private port: number;

  constructor(orchestrator: TaskOrchestrator, port: number = 3100) {
    this.orchestrator = orchestrator;
    this.port = port;
  }

  /**
   * 注册 webhook
   */
  registerWebhook(config: WebhookConfig): void {
    this.webhooks.set(config.path, config);
  }

  /**
   * 从工作流定义加载 webhook
   */
  loadFromWorkflow(workflow: WorkflowDefinition): void {
    if (!workflow.triggers) return;

    for (const trigger of workflow.triggers) {
      if (trigger.type === 'webhook' && trigger.path) {
        this.registerWebhook({
          path: trigger.path,
          workflowId: workflow.metadata.id,
        });
      }
    }
  }

  /**
   * 启动 HTTP 服务器
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.listen(this.port, () => {
        this.logger.info(`[WebhookReceiver] Listening on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * 处理请求
   */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = req.url || '/';
    const method = req.method || 'GET';

    // 查找匹配的 webhook
    const webhook = this.webhooks.get(url);
    
    if (!webhook) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    if (webhook.method && webhook.method !== method) {
      res.writeHead(405);
      res.end('Method Not Allowed');
      return;
    }

    try {
      // 读取请求体（如果有）
      let body = '';
      if (method === 'POST') {
        body = await new Promise<string>((resolve) => {
          let data = '';
          req.on('data', chunk => data += chunk);
          req.on('end', () => resolve(data));
        });
      }

      // 创建任务
      const task = await this.orchestrator.createTask({
        title: `Webhook: ${webhook.workflowId}`,
        type: 'custom',
        workflowId: webhook.workflowId,
      });

      this.orchestrator.enqueue(task.id);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, taskId: task.id }));

      this.logger.debug(`[WebhookReceiver] Triggered workflow ${webhook.workflowId}`);
    } catch (error: any) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  /**
   * 停止服务器
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  /**
   * 列出已注册的 webhook
   */
  listWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }
}
