# AgentWork 技术规格文档

## 概述

AgentWork 是一个完整的 **Agent Harness**（代理框架），参考 Deep Agents、Claude Code 等成熟系统设计。采用 TypeScript 开发，总计 **11987 行代码**。

---

## 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Agent Harness                         │
├─────────────────────────────────────────────────────────────┤
│  Skills System    Subagents      Memory System              │
│  (技能加载)       (子代理隔离)    (多层级记忆)                │
├─────────────────────────────────────────────────────────────┤
│  Tools Registry   Workflow       Sandbox                    │
│  (工具注册)       (工作流引擎)    (沙箱执行)                  │
├─────────────────────────────────────────────────────────────┤
│                    Agent Runner                             │
│            (模型抽象、Provider 管理、重试)                    │
├─────────────────────────────────────────────────────────────┤
│                 Protocols (ACP/MCP)                         │
│            (编辑器集成、工具服务器)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 模块详解

### 1. Sandbox 沙箱执行器 (314 行)

**位置**: `src/sandbox/`

**功能**:
- 多语言代码执行 (JavaScript, Python, Shell)
- 超时控制 (默认 30 秒)
- 内存限制
- 安全隔离 (限制文件系统/网络访问)

**核心 API**:
```typescript
class SandboxExecutor {
  constructor(config?: SandboxConfig);
  
  // 执行代码
  async executeCode(
    code: string, 
    language: 'javascript' | 'python' | 'shell'
  ): Promise<ExecutionResult>;
  
  // 执行脚本文件
  async executeScript(
    script: string, 
    args: string[]
  ): Promise<ExecutionResult>;
}

interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  peakMemoryMb?: number;
  error?: string;
}
```

**使用示例**:
```typescript
const executor = new SandboxExecutor({ timeout: 5000 });

// JavaScript
const js = await executor.executeCode('1 + 1', 'javascript');
console.log(js.stdout); // "2"

// Python
const py = await executor.executeCode('print("Hello")', 'python');

// Shell
const sh = await executor.executeCode('ls -la', 'shell');
```

---

### 2. Subagents 子代理模块 (948 行)

**位置**: `src/subagents/`

**功能**:
- 子代理注册和管理
- Context 隔离 (独立状态/历史)
- 自动匹配最适合的子代理
- General-purpose 子代理 (继承主代理能力)

**核心 API**:
```typescript
class SubAgentManager {
  constructor(config: SubAgentManagerConfig);
  
  // 注册子代理
  register(definition: SubAgentDefinition): void;
  
  // 调用子代理
  async invoke(
    name: string, 
    task: string, 
    context?: SubAgentContext
  ): Promise<SubAgentResult>;
  
  // 自动匹配子代理
  matchSubAgent(taskDescription: string): SubAgentDefinition | null;
  
  // 列出所有子代理
  list(): SubAgentDefinition[];
}

interface SubAgentDefinition {
  name: string;
  description: string;  // 用于自动匹配
  systemPrompt: string;
  tools?: string[];
  skills?: string[];
  model?: string;  // 可覆盖主代理模型
}
```

**使用示例**:
```typescript
const manager = new SubAgentManager({ db });

// 注册研究助手
manager.register({
  name: 'researcher',
  description: '研究助手，负责搜索和整理信息',
  systemPrompt: '你是一个专业的研究助手...',
  skills: ['web-search']
});

// 自动匹配
const matched = manager.matchSubAgent('帮我搜索最新的 AI 新闻');
// matched.name === 'researcher'

// 调用子代理
const result = await manager.invoke('researcher', '搜索 AI 新闻');
```

---

### 3. Context Engineering (1500 行)

**位置**: `src/context/`

**功能**:
- 上下文压缩 (防止 context bloat)
- 状态卸载 (保存到外部存储)
- 增量加载
- AI 辅助摘要

**核心 API**:
```typescript
// 压缩器
class Compactor {
  constructor(config?: CompactionConfig);
  
  // 判断是否需要压缩
  shouldCompact(messages: Message[], config?: CompactionConfig): boolean;
  
  // 压缩消息
  async compact(messages: Message[]): Promise<Message[]>;
}

// 卸载器
class Offloader {
  constructor(config?: OffloadConfig);
  
  // 卸载状态
  async offload(state: any): Promise<string>;
  
  // 加载状态
  async load(key: string): Promise<any>;
  
  // 删除状态
  async delete(key: string): Promise<void>;
}

// 统一管理
class ContextManagerImpl {
  // 检查上下文健康
  checkHealth(messages: Message[]): ContextHealth;
  
  // 自动管理
  async manage(messages: Message[]): Promise<Message[]>;
}
```

**使用示例**:
```typescript
const compactor = new Compactor({ maxMessages: 50 });

// 检查是否需要压缩
if (compactor.shouldCompact(messages)) {
  messages = await compactor.compact(messages);
}

// 卸载状态
const offloader = new Offloader({ storagePath: '/tmp/offload' });
const key = await offloader.offload(largeState);

// 后续加载
const state = await offloader.load(key);
```

---

### 4. ACP 协议支持 (725 行)

**位置**: `src/acp/`

**功能**:
- Agent Client Protocol 实现
- 编辑器集成 (Zed, JetBrains, VSCode)
- 任务管理
- 工具/技能注册

**核心 API**:
```typescript
class ACPServer {
  constructor(config: ACPServerConfig);
  
  // 启动服务器
  async start(): Promise<void>;
  async stop(): Promise<void>;
  
  // 注册工具
  registerTool(tool: ACPTool): void;
  
  // 注册技能
  registerSkill(skill: ACPSkill): void;
  
  // 事件处理
  on(event: string, handler: Function): void;
}

// AgentWork 适配器
class AgentWorkACPAdapter {
  constructor(config: AgentWorkACPAdapterConfig);
  
  // 适配到 AgentWork
  getServer(): ACPServer;
  
  // 注册 AgentWork 技能
  registerSkills(): void;
}
```

**支持的操作**:
- `tasks/run` - 运行任务
- `tasks/cancel` - 取消任务
- `chat` - 对话交互
- `tools/list` - 列出工具
- `skills/list` - 列出技能

---

### 5. Workflow Engine (456 行)

**位置**: `src/workflow/engine.ts`

**功能**:
- YAML 定义工作流
- 步骤依赖管理
- Checkpoint 支持
- 条件执行

**工作流定义**:
```yaml
apiVersion: agentwork/v1
kind: Workflow
metadata:
  name: content-creator
spec:
  inputs:
    topic:
      type: string
      required: true
  
  steps:
    - id: research
      skill: topic-research
      input:
        topic: "${inputs.topic}"
    
    - id: outline
      skill: content-outline
      dependsOn: [research]
    
    - id: review
      skill: content-review
      checkpoint:
        aiValidate: "检查内容质量"
    
    - id: publish
      skill: content-publish
      condition: "${steps.review.output.approved}"
```

---

### 6. Skills System (技能系统)

**位置**: `src/skills/`

**功能**:
- 渐进式加载
- 自动发现
- 按需执行

**技能定义**:
```typescript
interface Skill {
  path: string;
  manifest: {
    name: string;
    description: string;
    triggers?: string[];
    requires?: string[];
  };
  content: string;  // SKILL.md 内容
}
```

---

### 7. Memory System (记忆系统)

**位置**: `src/memory/`

**功能**:
- 多层级记忆 (session/task/project/global)
- 向量嵌入
- 语义搜索

**记忆层级**:
```typescript
type MemoryLevel = 'session' | 'task' | 'project' | 'global';
```

---

### 8. Agent Runner (代理运行时)

**位置**: `src/agent-engine/`

**功能**:
- 模型抽象
- Provider 管理
- 流式输出
- 重试机制

**支持的 Provider**:
- OpenAI
- Anthropic
- Ollama (本地)
- 自定义 Provider

---

## 数据存储

**位置**: `data/agentwork.db`

**表结构**:
- `workflows` - 工作流定义
- `workflow_runs` - 运行记录
- `skills` - 技能注册
- `memory` - 记忆存储

---

## API 服务

**端口**: 3000

**端点**:
- `GET /health` - 健康检查
- `GET /api/workflows` - 工作流列表
- `POST /api/workflows/:id/run` - 运行工作流
- `GET /api/skills` - 技能列表

---

## 配置文件

**位置**: `config/agentwork.yaml`

```yaml
apiVersion: agentwork/v1
kind: Config
metadata:
  name: agentwork

spec:
  model:
    default: qwen2.5:7b
    providers:
      - name: ollama
        apiBase: http://localhost:11434
  
  skills:
    paths:
      - ./skills/
  
  sandbox:
    enabled: true
    timeout: 60000
  
  memory:
    enabled: true
    persist: true
  
  protocols:
    acp:
      enabled: true
      port: 3000
```

---

## 与竞品对比

| 特性 | AgentWork | Deep Agents | Claude Code |
|------|-----------|-------------|-------------|
| 语言 | TypeScript | Python | TypeScript |
| Skills | ✅ 渐进式加载 | ✅ | ✅ |
| Subagents | ✅ Context 隔离 | ✅ | ✅ |
| Memory | ✅ 向量存储 | ✅ | ✅ |
| Workflow | ✅ YAML 定义 | ❌ | ❌ |
| ACP | ✅ 完整实现 | ✅ | ✅ |
| MCP | ✅ 客户端 | ✅ | ✅ |
| Sandbox | ✅ 多语言 | ✅ | ✅ |
| 开源 | ✅ MIT | ✅ | ❌ 闭源 |

---

## 快速开始

```bash
# 安装
cd ~/.openclaw/extensions/agentwork
npm install

# 编译
npm run build

# 启动服务
node start-api.mjs

# 运行工作流
curl -X POST http://localhost:3000/api/workflows/content-creator/run \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI Agent"}'
```

---

## 代码统计

| 模块 | 文件数 | 代码行数 |
|------|--------|----------|
| Sandbox | 3 | 314 |
| Subagents | 4 | 948 |
| Context | 4 | 1500 |
| ACP | 4 | 725 |
| Workflow | 5 | 456 |
| Skills | 3 | 300+ |
| Memory | 3 | 200+ |
| Agent Engine | 2 | 374 |
| Database | 1 | 486 |
| **总计** | **29+** | **11987** |

---

## 下一步开发

1. [ ] MCP 客户端实现
2. [ ] ACP stdio 模式
3. [ ] 更多测试用例
4. [ ] Web Dashboard
5. [ ] 更多技能模板

---

*文档版本: 2026-03-22*
*Commit: 98424c2*