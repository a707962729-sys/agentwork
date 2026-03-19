/**
 * 对话 API 路由
 */

import { Router, Request, Response } from 'express';

const router = Router();

// 对话历史存储（简化版，实际应使用数据库）
const chatHistory: Map<string, any[]> = new Map();

// 获取对话历史
router.get('/history', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string || 'default';
  const history = chatHistory.get(sessionId) || [];
  res.json({ history, total: history.length });
});

// 发送消息
router.post('/', async (req: Request, res: Response) => {
  try {
    const orchestrator = req.app.locals.orchestrator;
    const { message, sessionId = 'default' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // 获取或创建历史
    if (!chatHistory.has(sessionId)) {
      chatHistory.set(sessionId, []);
    }
    const history = chatHistory.get(sessionId)!;
    
    // 添加用户消息
    history.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // 简单的意图识别
    let response: string;
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('创建任务') || lowerMessage.includes('新建任务')) {
      // 提取任务标题
      const titleMatch = message.match(/["「『]([^"」』]+)["」』]/);
      const title = titleMatch ? titleMatch[1] : '新任务';
      
      const task = await orchestrator.createTask({ title });
      response = `✅ 已创建任务: ${task.title}\n任务ID: ${task.id}\n\n使用 "执行任务 ${task.id}" 来运行它。`;
    } else if (lowerMessage.includes('任务列表') || lowerMessage.includes('查看任务')) {
      const tasks = orchestrator.listTasks(10);
      if (tasks.length === 0) {
        response = '📋 暂无任务。使用 "创建任务 任务名称" 来创建。';
      } else {
        const taskList = tasks.map(t => `- [${t.status}] ${t.title}`).join('\n');
        response = `📋 任务列表:\n${taskList}`;
      }
    } else if (lowerMessage.includes('执行任务')) {
      const idMatch = message.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
      if (idMatch) {
        await orchestrator.execute(idMatch[0]);
        response = `🚀 任务执行已启动: ${idMatch[0]}`;
      } else {
        response = '❌ 请提供有效的任务ID';
      }
    } else if (lowerMessage.includes('帮助') || lowerMessage.includes('help')) {
      response = `🤖 AgentWork 助手

可用命令:
- 创建任务 "任务名称" - 创建新任务
- 任务列表 - 查看所有任务
- 执行任务 <ID> - 运行指定任务
- 帮助 - 显示此帮助信息`;
    } else {
      response = `收到: "${message}"\n\n我是 AgentWork 助手，可以帮助您管理任务。输入 "帮助" 查看可用命令。`;
    }
    
    // 添加助手回复
    history.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      response,
      sessionId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 清除历史
router.delete('/history', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string || 'default';
  chatHistory.delete(sessionId);
  res.json({ success: true });
});

export default router;