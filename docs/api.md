# API Reference

Complete API documentation for AgentWork.

## 📦 Installation

```bash
npm install agentwork
```

## 🚀 Quick Start

```typescript
import { getAgentWork, AgentWork } from 'agentwork';

// Get AgentWork instance
const app: AgentWork = await getAgentWork();

// Access core components
const orchestrator = app.getOrchestrator();
const workflowEngine = app.getWorkflowEngine();
const skillsRegistry = app.getSkillsRegistry();
```

## 📋 Core Classes

### AgentWork

Main application class.

```typescript
class AgentWork {
  // Get orchestrator for task management
  getOrchestrator(): Orchestrator;
  
  // Get workflow engine
  getWorkflowEngine(): WorkflowEngine;
  
  // Get skills registry
  getSkillsRegistry(): SkillsRegistry;
  
  // Get agent registry
  getAgentRegistry(): AgentRegistry;
  
  // Get database
  getDatabase(): Database;
}
```

### getAgentWork()

Get or create AgentWork instance.

```typescript
async function getAgentWork(config?: Config): Promise<AgentWork>
```

**Parameters:**
- `config` (optional): Configuration options

**Returns:** Promise<AgentWork>

**Example:**
```typescript
const app = await getAgentWork({
  configPath: './config.yaml',
  dataPath: './data'
});
```

## 🎯 Orchestrator API

Task orchestration and execution.

```typescript
class Orchestrator {
  // Create a new task
  createTask(task: TaskInput): Promise<Task>;
  
  // Get task by ID
  getTask(taskId: string): Task | null;
  
  // List tasks
  listTasks(limit?: number): Task[];
  
  // Execute a task
  execute(taskId: string): Promise<void>;
  
  // Cancel a task
  cancel(taskId: string): Promise<void>;
  
  // Event emitter
  on(event: string, callback: Function): void;
}
```

### TaskInput

```typescript
interface TaskInput {
  title: string;
  type: string;
  description?: string;
  workflowId?: string;
  priority?: number;
}
```

### Task

```typescript
interface Task {
  id: string;
  title: string;
  type: string;
  status: TaskStatus;
  description?: string;
  workflowId?: string;
  steps: TaskStep[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

type TaskStatus = 
  | 'pending'
  | 'decomposing'
  | 'ready'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused';
```

### TaskStep

```typescript
interface TaskStep {
  id: string;
  taskId: string;
  orderId: number;
  title: string;
  skill: string;
  agent?: string;
  status: StepStatus;
  input?: any;
  output?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

type StepStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed';
```

### Events

```typescript
orchestrator.on('task:created', (event: TaskEvent) => {
  console.log('Task created:', event.data.id);
});

orchestrator.on('task:started', (event: TaskEvent) => {
  console.log('Task started:', event.data.id);
});

orchestrator.on('step:started', (event: StepEvent) => {
  console.log('Step started:', event.data.title);
});

orchestrator.on('step:completed', (event: StepEvent) => {
  console.log('Step completed:', event.data.stepId);
});

orchestrator.on('task:completed', (event: TaskEvent) => {
  console.log('Task completed:', event.data.id);
});

orchestrator.on('task:failed', (event: TaskEvent) => {
  console.log('Task failed:', event.data.id, event.data.error);
});
```

### Example

```typescript
const orchestrator = app.getOrchestrator();

// Create task
const task = await orchestrator.createTask({
  title: 'Write article about AI',
  type: 'content',
  description: 'Create a comprehensive guide',
  workflowId: 'content-publish'
});

// Listen to events
orchestrator.on('step:completed', (event) => {
  console.log(`Step ${event.data.stepId} completed`);
});

// Execute
await orchestrator.execute(task.id);
```

## 🔄 Workflow Engine API

Workflow management and execution.

```typescript
class WorkflowEngine {
  // List workflows
  listWorkflows(): Workflow[];
  
  // Get workflow by ID
  getWorkflow(id: string): Workflow | null;
  
  // Run workflow
  run(workflowId: string, inputs?: Record<string, any>): Promise<WorkflowRun>;
  
  // Load workflow from file
  loadFromFile(filepath: string): Promise<Workflow>;
  
  // Get run status
  getRunStatus(runId: string): WorkflowRunStatus;
  
  // Cancel run
  cancelRun(runId: string): Promise<void>;
}
```

### Workflow

```typescript
interface Workflow {
  apiVersion: string;
  kind: string;
  metadata: WorkflowMetadata;
  triggers: Trigger[];
  inputs: Record<string, InputDefinition>;
  steps: StepDefinition[];
  outputs: Record<string, string>;
}

interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  tags?: string[];
}
```

### WorkflowRun

```typescript
interface WorkflowRun {
  id: string;
  workflowId: string;
  status: RunStatus;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  stepResults: Record<string, StepResult>;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

type RunStatus = 
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';
```

### Example

```typescript
const engine = app.getWorkflowEngine();

// List workflows
const workflows = engine.listWorkflows();
console.log('Available workflows:', workflows.map(w => w.metadata.id));

// Run workflow
const run = await engine.run('content-publish', {
  topic: 'AI Agents',
  style: 'professional',
  auto_publish: true
});

console.log('Workflow run started:', run.id);

// Check status
const status = engine.getRunStatus(run.id);
console.log('Status:', status.status);
```

## 🔧 Skills Registry API

Skill management.

```typescript
class SkillsRegistry {
  // List all skills
  list(): Skill[];
  
  // Get skill by name
  get(name: string): Skill | null;
  
  // Search skills
  search(query: string): Skill[];
  
  // Install skill
  install(source: string): Promise<Skill>;
  
  // Uninstall skill
  uninstall(name: string): Promise<void>;
  
  // Check if skill exists
  has(name: string): boolean;
}
```

### Skill

```typescript
interface Skill {
  manifest: SkillManifest;
  path: string;
  installed: boolean;
}

interface SkillManifest {
  name: string;
  description: string;
  metadata: {
    category: string;
    triggers: string[];
    author?: string;
    version?: string;
  };
}
```

### Example

```typescript
const registry = app.getSkillsRegistry();

// List skills
const skills = registry.list();
skills.forEach(skill => {
  console.log(`${skill.manifest.name}: ${skill.manifest.description}`);
});

// Search skills
const results = registry.search('writing');
console.log('Writing skills:', results.map(s => s.manifest.name));

// Install skill
const skill = await registry.install('./skills/my-skill');
console.log('Installed:', skill.manifest.name);

// Check existence
if (registry.has('article-writing')) {
  console.log('Article writing skill is available');
}
```

## 🤖 Agent Registry API

Agent management.

```typescript
class AgentRegistry {
  // List all agents
  list(): Agent[];
  
  // Get agent by ID
  get(id: string): Agent | null;
  
  // Load agent from file
  loadFromFile(filepath: string): Promise<Agent>;
  
  // Check if agent exists
  has(id: string): boolean;
}
```

### Agent

```typescript
interface Agent {
  id: string;
  name: string;
  description?: string;
  model: string;
  skills: string[];
  tools: {
    allow: string[];
    deny: string[];
  };
  persona?: {
    tone: string;
    style: string;
    expertise: string[];
  };
}
```

### Example

```typescript
const registry = app.getAgentRegistry();

// List agents
const agents = registry.list();
agents.forEach(agent => {
  console.log(`${agent.id}: ${agent.name} (${agent.model})`);
});

// Get specific agent
const writer = registry.get('content-writer');
if (writer) {
  console.log('Skills:', writer.skills);
  console.log('Tools:', writer.tools.allow);
}
```

## 🗄️ Database API

Data persistence.

```typescript
class Database {
  // Get task by ID
  getTask(taskId: string): Task | null;
  
  // Save task
  saveTask(task: Task): void;
  
  // List tasks
  listTasks(limit?: number): Task[];
  
  // Delete task
  deleteTask(taskId: string): void;
  
  // Get workflow run
  getRun(runId: string): WorkflowRun | null;
  
  // Save run
  saveRun(run: WorkflowRun): void;
}
```

### Example

```typescript
const db = app.getDatabase();

// Get task
const task = db.getTask('task-123');
if (task) {
  console.log('Task:', task.title);
}

// List recent tasks
const tasks = db.listTasks(10);
tasks.forEach(t => console.log(t.title));
```

## 🛠️ Utility Functions

### getStatusEmoji()

Get emoji for status.

```typescript
function getStatusEmoji(status: string): string;
```

**Example:**
```typescript
console.log(getStatusEmoji('completed')); // ✅
console.log(getStatusEmoji('running'));   // 🔄
console.log(getStatusEmoji('failed'));    // ❌
```

## 📊 Types Reference

### TaskStatus

```typescript
type TaskStatus = 
  | 'pending'      // ⏳ Task created, not started
  | 'decomposing'  // 🔍 Breaking down into steps
  | 'ready'        // 📋 Ready to execute
  | 'running'      // 🔄 Currently executing
  | 'completed'    // ✅ Successfully completed
  | 'failed'       // ❌ Execution failed
  | 'paused';      // ⏸️ Temporarily paused
```

### StepStatus

```typescript
type StepStatus = 
  | 'pending'     // ⏳ Not started
  | 'running'     // 🔄 In progress
  | 'completed'   // ✅ Done
  | 'failed';     // ❌ Error occurred
```

### RunStatus

```typescript
type RunStatus = 
  | 'running'     // 🔄 Workflow executing
  | 'completed'   // ✅ All steps done
  | 'failed'      // ❌ Error occurred
  | 'cancelled';  // ⏹️ Manually cancelled
```

## 🎯 Complete Example

```typescript
import { getAgentWork } from 'agentwork';

async function main() {
  // Initialize
  const app = await getAgentWork();
  
  // Get components
  const orchestrator = app.getOrchestrator();
  const workflowEngine = app.getWorkflowEngine();
  const skillsRegistry = app.getSkillsRegistry();
  
  // List available skills
  console.log('Available skills:');
  skillsRegistry.list().forEach(skill => {
    console.log(`  - ${skill.manifest.name}: ${skill.manifest.description}`);
  });
  
  // List available workflows
  console.log('\nAvailable workflows:');
  workflowEngine.listWorkflows().forEach(wf => {
    console.log(`  - ${wf.metadata.id}: ${wf.metadata.name}`);
  });
  
  // Create and run a task
  const task = await orchestrator.createTask({
    title: 'Write article about TypeScript',
    type: 'content',
    workflowId: 'content-publish'
  });
  
  console.log(`\nCreated task: ${task.id}`);
  
  // Listen to events
  orchestrator.on('step:completed', (event) => {
    console.log(`  ✅ Step completed: ${event.data.title}`);
  });
  
  orchestrator.on('task:completed', () => {
    console.log('\n🎉 Task completed!');
  });
  
  // Execute
  await orchestrator.execute(task.id);
  
  // Get final result
  const finalTask = orchestrator.getTask(task.id);
  console.log('\nFinal status:', finalTask?.status);
}

main().catch(console.error);
```

## 🆘 Error Handling

```typescript
try {
  const task = await orchestrator.createTask({
    title: 'My Task',
    type: 'content'
  });
  await orchestrator.execute(task.id);
} catch (error: any) {
  console.error('Task failed:', error.message);
  
  // Get task status
  const task = orchestrator.getTask(taskId);
  if (task?.steps) {
    const failedStep = task.steps.find(s => s.status === 'failed');
    if (failedStep) {
      console.error('Failed step:', failedStep.title);
      console.error('Error:', failedStep.error);
    }
  }
}
```

## 📚 Additional Resources

- [Getting Started Guide](./getting-started.md)
- [Skills Development Guide](./skills.md)
- [Workflow Definition Guide](./workflows.md)
- [Agent Configuration Guide](./agents.md)
