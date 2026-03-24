# AgentWork - Agent Harness 架构设计

## 核心概念

AgentWork 是一个完整的 **Agent Harness**，参考 Deep Agents、Claude Code 等成熟系统设计。

```
┌─────────────────────────────────────────────────────────────┐
│                        Agent Harness                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Skills    │  │ Subagents   │  │      Memory         │  │
│  │   System    │  │  (Isolated) │  │  (Short/Long-term)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Tools     │  │  Workflow   │  │      Sandbox        │  │
│  │   Registry  │  │   Engine    │  │   (Isolated Exec)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Agent Runner                        │  │
│  │    (Model Abstraction, Provider Management, Retry)    │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Protocols (ACP/MCP)                       │  │
│  │         (Editor Integration, Tool Servers)             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 核心模块

### 1. Skills System (技能系统)

**参考**: Deep Agents Skills, OpenClaw SKILL.md

```typescript
// 渐进式加载
interface Skill {
  path: string;
  manifest: {
    name: string;
    description: string;  // 用于匹配
    triggers?: string[];
    requires?: string[];
  };
  content: string;  // SKILL.md 内容
}

// 技能生命周期
class SkillsRegistry {
  // 发现技能
  discover(query: string): Promise<Skill[]>;
  
  // 按需加载
  load(skillPath: string): Promise<Skill>;
  
  // 执行技能
  execute(skill: Skill, input: any): Promise<any>;
}
```

### 2. Subagents (子代理隔离)

**参考**: Deep Agents Subagents

```typescript
// 子代理定义
interface SubAgentDefinition {
  name: string;
  description: string;  // 主代理用于决定何时委派
  systemPrompt: string;
  tools?: string[];
  skills?: string[];
  model?: string;  // 可覆盖模型
}

// Context 隔离
class SubAgentManager {
  // 调用子代理，只返回结果摘要
  invoke(name: string, task: string): Promise<SubAgentResult>;
  
  // 自动匹配最合适的子代理
  matchSubAgent(taskDescription: string): string | null;
}

// General-purpose 子代理（继承主代理能力）
class GeneralPurposeSubAgent {
  // 自动继承主代理的 tools/skills/model
}
```

### 3. Memory System (记忆系统)

**参考**: Deep Agents Long-term Memory

```typescript
// 记忆层级
type MemoryLevel = 'session' | 'task' | 'project' | 'global';

interface MemoryEntry {
  id: string;
  level: MemoryLevel;
  content: string;
  embedding?: number[];  // 向量嵌入
  metadata: Record<string, any>;
  createdAt: Date;
}

// 记忆管理
class MemoryManager {
  // 存储记忆
  store(entry: MemoryEntry): Promise<void>;
  
  // 语义搜索
  search(query: string, options: SearchOptions): Promise<MemorySearchResult[]>;
  
  // 压缩/摘要
  compact(entries: MemoryEntry[]): Promise<string>;
}
```

### 4. Tools Registry (工具注册)

```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: (input: any) => Promise<any>;
}

class ToolsRegistry {
  register(tool: Tool): void;
  invoke(name: string, input: any): Promise<any>;
  list(): Tool[];
}
```

### 5. Sandbox (沙箱执行)

```typescript
interface SandboxConfig {
  timeout: number;
  maxMemory: number;
  networkAccess: 'none' | 'restricted' | 'full';
  fsAccess: boolean;
}

class SandboxExecutor {
  // 执行代码
  executeCode(code: string, language: string): Promise<ExecutionResult>;
  
  // 执行脚本
  executeScript(script: string, args: string[]): Promise<ExecutionResult>;
}
```

### 6. Workflow Engine (工作流引擎)

```yaml
# workflow.yaml
apiVersion: agentwork/v1
kind: Workflow
metadata:
  name: content-creator
  description: 内容创作工作流
spec:
  inputs:
    topic:
      type: string
      required: true
    platform:
      type: string
      default: "wechat"
  
  steps:
    - id: research
      skill: topic-research
      input:
        topic: "${inputs.topic}"
    
    - id: outline
      skill: content-outline
      dependsOn: [research]
      input:
        researchResult: "${steps.research.output}"
    
    - id: write
      skill: content-writing
      dependsOn: [outline]
    
    - id: review
      skill: content-review
      dependsOn: [write]
      checkpoint:
        aiValidate: "检查内容质量"
    
    - id: publish
      skill: content-publish
      dependsOn: [review]
      condition: "${steps.review.output.approved}"
```

### 7. Agent Runner (代理运行时)

```typescript
interface AgentRunnerConfig {
  defaultModel: string;
  providers: Record<string, AIProvider>;
  timeout: number;
  maxRetries: number;
}

class AgentRunner {
  // 运行代理
  run(input: AgentInput): Promise<AgentOutput>;
  
  // 流式输出
  stream(input: AgentInput): AsyncIterator<AgentEvent>;
  
  // 模型切换
  setModel(model: string): void;
}

// AI Provider 抽象
interface AIProvider {
  name: string;
  complete(messages: Message[]): Promise<string>;
  stream(messages: Message[]): AsyncIterator<string>;
}
```

### 8. Protocols (协议支持)

#### ACP (Agent Client Protocol)

```typescript
// 编辑器集成
class ACPServer {
  // stdio 模式
  start(): Promise<void>;
  
  // 请求处理
  handleRequest(request: ACPRequest): Promise<ACPResponse>;
}

// 支持: Zed, JetBrains, VSCode
```

#### MCP (Model Context Protocol)

```typescript
// 工具服务器
class MCPClient {
  connect(serverPath: string): Promise<void>;
  listTools(): Promise<Tool[]>;
  invokeTool(name: string, input: any): Promise<any>;
}
```

## 数据模型

```typescript
// 任务
interface Task {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  steps: TaskStep[];
  result?: any;
}

// 工作流运行
interface WorkflowRun {
  id: string;
  workflowId: string;
  status: TaskStatus;
  inputs: Record<string, any>;
  steps: TaskStep[];
  outputs?: Record<string, any>;
}

// 技能
interface Skill {
  path: string;
  manifest: SkillManifest;
  content: string;
}
```

## API 设计

```typescript
// 创建代理
const agent = createAgent({
  model: 'claude-sonnet-4',
  skills: ['./skills/content/'],
  tools: ['fs_read', 'fs_write', 'shell_exec'],
  subagents: [researcher, writer]
});

// 运行任务
const result = await agent.run({
  task: '写一篇关于 AI Agent 的文章',
  context: { platform: 'wechat' }
});

// 委派给子代理
const research = await agent.delegate('researcher', '研究 Agent Harness');

// 流式输出
for await (const event of agent.stream(input)) {
  console.log(event);
}
```

## 配置文件

```yaml
# agentwork.yaml
apiVersion: agentwork/v1
kind: Config
metadata:
  name: my-agent

spec:
  model:
    default: claude-sonnet-4
    providers:
      - name: anthropic
        apiKey: ${ANTHROPIC_API_KEY}
      - name: openai
        apiKey: ${OPENAI_API_KEY}
      - name: ollama
        apiBase: http://localhost:11434
  
  skills:
    paths:
      - ./skills/
      - ~/.openclaw/skills/
  
  tools:
    allow:
      - fs_read
      - fs_write
      - shell_exec
      - web_search
    deny:
      - rm -rf
  
  sandbox:
    enabled: true
    timeout: 60000
    networkAccess: restricted
  
  memory:
    enabled: true
    persist: true
    vectorStore: lance
  
  subagents:
    - name: researcher
      description: 深度调研助手
      skills: [./skills/research/]
      model: claude-sonnet-4
    
    - name: writer
      description: 内容创作助手
      skills: [./skills/writing/]
  
  protocols:
    acp:
      enabled: true
      port: 3000
    mcp:
      servers:
        - name: filesystem
          command: mcp-filesystem-server
          args: [--root, ./data]
```

## 启动方式

```bash
# CLI 模式
agentwork run "写一篇文章"

# API 模式
agentwork serve --port 3000

# ACP 模式 (编辑器集成)
agentwork acp

# 工作流模式
agentwork workflow run content-creator --input topic=AI
```

## 对比

| 特性 | AgentWork | Deep Agents | Claude Code |
|------|-----------|-------------|-------------|
| 语言 | TypeScript | Python | TypeScript |
| Skills | ✅ | ✅ | ✅ |
| Subagents | ✅ | ✅ | ✅ |
| Memory | ✅ | ✅ | ✅ |
| Workflow | ✅ | ❌ | ❌ |
| ACP | ✅ | ✅ | ✅ |
| MCP | ✅ | ✅ | ✅ |
| Sandbox | ✅ | ✅ | ✅ |
| 开源 | ✅ | ✅ | ❌ |

## 下一步

1. [ ] 完善 Sandbox 执行器
2. [ ] 实现完整的 Subagent 执行逻辑
3. [ ] 添加 Context Engineering (压缩、卸载)
4. [ ] 实现 ACP stdio 模式
5. [ ] 添加 MCP 客户端
6. [ ] 完善测试
7. [ ] 编写文档