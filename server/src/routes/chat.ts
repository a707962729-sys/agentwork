/**
 * 对话 API 路由
 * 支持文本消息和 multipart/form-data 附件
 * 已接入 LLM，支持 Function Calling 自动执行任务
 * 聊天记录持久化到 SQLite
 */

import { Router, Request, Response } from 'express';
import { parseFormData, FormDataFields } from '../utils/formData.js';
import Database from 'better-sqlite3';
import { join } from 'path';

const router = Router();

// 对话历史存储（内存，备用）
const chatHistory: Map<string, any[]> = new Map();
const MAX_HISTORY_LENGTH = 20;

// ============================================================
// SQLite 数据库初始化
// ============================================================
function getChatDb(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      attachments TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON chat_messages(created_at);
  `);
  return db;
}

// 获取或创建 session
function ensureSession(db: Database.Database, sessionId: string) {
  db.prepare(`INSERT OR IGNORE INTO chat_sessions (session_id) VALUES (?)`).run(sessionId);
  db.prepare(`UPDATE chat_sessions SET updated_at = datetime('now') WHERE session_id = ?`).run(sessionId);
}

// 写入消息
function saveMessage(db: Database.Database, sessionId: string, role: string, content: string, attachments?: string) {
  db.prepare(`INSERT INTO chat_messages (session_id, role, content, attachments) VALUES (?, ?, ?, ?)`)
    .run(sessionId, role, content, attachments || null);
}

// 读取历史（最近 N 条）
function loadHistory(db: Database.Database, sessionId: string, limit: number = 20) {
  const rows = db.prepare(
    `SELECT role, content, attachments, created_at FROM chat_messages
     WHERE session_id = ? ORDER BY created_at DESC LIMIT ?`
  ).all(sessionId, limit) as any[];
  return rows.reverse(); // 按时间正序返回
}

// ============================================================
// 动作执行函数
// ============================================================
async function executeAction(action: string, params: Record<string, any>, orchestrator: any): Promise<string> {
  try {
    switch (action) {
      case 'create_task': {
        const { title, description } = params;
        const task = await orchestrator.createTask({ title, description: description || '' });
        return `✅ 任务已创建！\n标题：${task.title}\nID：${task.id}`;
      }
      case 'list_tasks': {
        const { limit = 10 } = params;
        const tasks = orchestrator.listTasks(limit);
        if (!tasks.length) return '📋 当前没有任务。';
        return `📋 任务列表（共${tasks.length}个）：\n${tasks.map((t: any) => `[${t.status}] ${t.title}`).join('\n')}`;
      }
      case 'execute_task': {
        const { task_id } = params;
        await orchestrator.execute(task_id);
        return `🚀 任务已启动执行！ID：${task_id}`;
      }
      default:
        return `⚠️ 未知操作：${action}`;
    }
  } catch (err: any) {
    return `⚠️ 操作失败：${err.message}`;
  }
}

// 从 LLM 回复文本中解析 JSON 指令
function parseActionFromResponse(text: string): { action: string; params: Record<string, any> } | null {
  // 优先 <action> 标签
  const tagMatch = text.match(/<action>\s*({.*?})\s*<\/action>/s);
  if (tagMatch) {
    try { return JSON.parse(tagMatch[1]); } catch { /* fall through */ }
  }
  // 兼容直接输出 JSON
  const jsonMatch = text.match(/\{\s*"action"\s*:\s*"?\w+"?\s*,\s*"params"\s*:\s*\{/);
  if (jsonMatch) {
    try { return JSON.parse(text); } catch { /* try extracting just the JSON part */ }
    // 尝试提取 JSON 部分
    const braceStart = text.indexOf('{');
    const braceEnd = text.lastIndexOf('}');
    if (braceStart >= 0 && braceEnd > braceStart) {
      try { return JSON.parse(text.substring(braceStart, braceEnd + 1)); } catch { }
    }
  }
  return null;
}

// ============================================================
// LLM 调用（含动作执行循环）
// ============================================================
async function callLLMWithActions(
  messages: any[],
  modelConfig: { baseUrl: string; apiKey: string; modelId: string },
  orchestrator: any,
  maxIterations: number = 2
): Promise<string> {
  const { baseUrl, apiKey, modelId } = modelConfig;
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  let currentMessages = [...messages];

  for (let i = 0; i < maxIterations; i++) {
    // MiniMax 要求最后一条必须是 user，找最近一条 user 消息
    const lastUserIdx = currentMessages.length - 1
    let sendMsgs: any[]
    if (currentMessages[lastUserIdx]?.role === 'user') {
      sendMsgs = [currentMessages[0], currentMessages[lastUserIdx]]
    } else {
      // 最后不是 user，往前找最近的 user
      let userIdx = -1
      for (let i = lastUserIdx - 1; i >= 1; i--) {
        if (currentMessages[i]?.role === 'user') { userIdx = i; break }
      }
      sendMsgs = userIdx >= 1 ? [currentMessages[0], currentMessages[userIdx]] : [currentMessages[0]]
    }

    const body: any = {
      model: modelId,
      messages: sendMsgs,
      temperature: 0.7
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API 错误: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error('LLM 无有效回复');

    currentMessages.push(msg);
    const text = msg.content || '';

    // 尝试解析动作指令
    const actionObj = parseActionFromResponse(text);
    if (actionObj) {
      const result = await executeAction(actionObj.action, actionObj.params, orchestrator);
      // 把执行结果追加为 user 消息，让 LLM 生成最终回复
      currentMessages.push({ role: 'user', content: `结果：${result}` });
      if (i === maxIterations - 1) {
        return result;
      }
    } else {
      return text;
    }
  }

  return '(执行轮次过多)';
}

// ============================================================
// 系统提示词
// ============================================================
const SYSTEM_PROMPT = `You are AgentWork assistant. When user asks to create/list/execute tasks, reply with action JSON at end: {"action":"create_task","params":{"title":"title"}} or {"action":"list_tasks","params":{}} or {"action":"execute_task","params":{"task_id":"UUID"}}. Otherwise answer directly in Chinese.`;

// ============================================================
// 意图识别（轻量兜底）
// ============================================================
function isCommandMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('创建任务') ||
         lower.includes('新建任务') ||
         lower.includes('任务列表') ||
         lower.includes('查看任务') ||
         lower.includes('执行任务') ||
         lower.includes('帮助') ||
         lower.includes('help');
}

// 简单命令执行（兜底）
async function executeCommand(message: string, orchestrator: any): Promise<string> {
  const lower = message.toLowerCase();

  if (lower.includes('创建任务') || lower.includes('新建任务')) {
    const titleMatch = message.match(/["「『]([^"」』]+)["」』]/);
    const title = titleMatch ? titleMatch[1] : '新任务';
    const task = await orchestrator.createTask({ title });
    return `✅ 已创建任务: ${task.title}\n任务ID: ${task.id}`;
  } else if (lower.includes('任务列表') || lower.includes('查看任务')) {
    const tasks = orchestrator.listTasks(10);
    if (tasks.length === 0) return '📋 暂无任务。使用 "创建任务 任务名称" 来创建。';
    return `📋 任务列表:\n${tasks.map((t: any) => `- [${t.status}] ${t.title}`).join('\n')}`;
  } else if (lower.includes('执行任务')) {
    const idMatch = message.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
    if (idMatch) {
      await orchestrator.execute(idMatch[0]);
      return `🚀 任务执行已启动: ${idMatch[0]}`;
    }
    return '❌ 请提供有效的任务ID';
  } else if (lower.includes('帮助') || lower.includes('help')) {
    return `🤖 AgentWork 助手

可用命令:
- 创建任务 "任务名称" - 创建新任务
- 任务列表 - 查看所有任务
- 执行任务 <ID> - 运行指定任务
- 帮助 - 显示此帮助信息`;
  }
  return '';
}

// ============================================================
// 获取模型配置
async function getModelConfig(db: any) {
  try {
    const models = db.listModels();
    if (!models || models.length === 0) return null;
    const def = models.find((m: any) => m.isDefault) || models[0];
    return {
      baseUrl: def.baseUrl || 'https://api.minimaxi.com/v1',
      apiKey: def.apiKey || '',
      modelId: def.modelId || 'MiniMax-M2.7'
    };
  } catch {
    return null;
  }
}

// 获取系统状态上下文
async function getSystemContext(orchestrator: any): Promise<string> {
  try {
    const tasks = orchestrator.listTasks(5);
    if (!tasks.length) return '系统当前无任务。';
    return `当前任务（前5个）:\n${tasks.map((t: any) => `[${t.status}] ${t.title} (${t.id.substring(0, 8)})`).join('\n')}`;
  } catch {
    return '无法获取系统状态。';
  }
}

// ============================================================
// 数据库路径（从主 server 注入）
// ============================================================
let chatDb: Database.Database;
let dbPath: string;

function initChatDb(path: string) {
  dbPath = path;
  chatDb = getChatDb(path);
  console.log('[Chat] SQLite 聊天记录数据库已初始化:', path);
}

// 导出初始化函数，供 server/index.ts 调用
export { initChatDb };

// 获取当前 DB 实例（lazy init）
function getDb(req?: any): Database.Database | null {
  if (chatDb) return chatDb;
  if (req?.app?.locals?.chatDbPath) {
    chatDb = getChatDb(req.app.locals.chatDbPath);
    return chatDb;
  }
  return null;
}

// ============================================================
// API 路由
// ============================================================

// 发送消息
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = req.app.locals.db;
    const orchestrator = req.app.locals.orchestrator;
    const contentType = req.headers['content-type'] || '';

    let message = '';
    let sessionId = 'default';
    const files: { name: string; type: string; size: number; path?: string }[] = [];

    if (contentType.includes('multipart/form-data')) {
      const fields = await parseFormData(req) as FormDataFields;
      message = (fields.message as string) || '';
      sessionId = (fields.sessionId as string) || 'default';
      if (fields.files) {
        files.push(...fields.files.map((f: any) => ({
          name: f.originalFilename || f.filename,
          type: f.mimetype || 'application/octet-stream',
          size: f.size,
          path: f.filepath,
        })));
      }
    } else {
      const body = req.body as { message?: string; sessionId?: string };
      message = body.message || '';
      sessionId = body.sessionId || 'default';
    }

    // Lazy init DB if not yet started
    if (!chatDb) {
      const chatDbPath = (req.app.locals as any)?.chatDbPath;
      if (chatDbPath) {
        chatDb = getChatDb(chatDbPath);
        console.log('[Chat] DB 已连接:', chatDbPath);
      }
    }

    if (!message && files.length === 0) {
      return res.status(400).json({ error: 'Message or files required' });
    }

    // 持久化：写入用户消息
    if (chatDb) {
      ensureSession(chatDb, sessionId);
      saveMessage(chatDb, sessionId, 'user', message, files.length > 0 ? JSON.stringify(files) : undefined);
    }

    let response: string;

    if (isCommandMessage(message)) {
      response = await executeCommand(message, orchestrator);
    } else {
      const modelConfig = await getModelConfig(db);
      if (!modelConfig) {
        response = '⚠️ 未配置 LLM 模型。';
      } else {
        try {
          // 从 SQLite 加载历史（最多20条）
          const history = chatDb ? loadHistory(chatDb, sessionId, 20) : [];
          const systemContext = await getSystemContext(orchestrator);

          // 把历史压缩进 system prompt（MiniMax 只支持 system + user 两条）
          let systemContent = `${SYSTEM_PROMPT}\n\n## 当前系统状态\n${systemContext}`;
          if (history.length > 0) {
            systemContent += '\n\n## 会话记忆\n';
            for (const h of history.slice(-6)) {
              systemContent += `${h.role === 'user' ? '用户' : '助手'}说：${h.content.substring(0, 150)}\n`;
            }
          }

          const llmMessages = [
            { role: 'system', content: systemContent },
            { role: 'user', content: message }
          ];

          response = await callLLMWithActions(llmMessages, modelConfig, orchestrator);
        } catch (err: any) {
          console.error('[Chat] LLM 调用失败:', err);
          response = `⚠️ LLM 调用失败: ${err.message}`;
        }
      }
    }

    // 持久化：写入助手回复
    if (chatDb) {
      saveMessage(chatDb, sessionId, 'assistant', response);
    }

    res.json({
      reply: response,
      sessionId,
      files,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取对话历史
router.get('/history', (req: Request, res: Response) => {
  const sessionId = (req.query.sessionId as string) || 'default';
  if (!chatDb) {
    return res.json({ history: [], total: 0 });
  }
  const rows = loadHistory(chatDb, sessionId, 50);
  res.json({ history: rows, total: rows.length });
});

// 清除历史
router.delete('/history', (req: Request, res: Response) => {
  const sessionId = (req.query.sessionId as string) || 'default';
  if (chatDb) {
    chatDb.prepare(`DELETE FROM chat_messages WHERE session_id = ?`).run(sessionId);
    chatDb.prepare(`DELETE FROM chat_sessions WHERE session_id = ?`).run(sessionId);
  }
  res.json({ success: true });
});

export default router;
