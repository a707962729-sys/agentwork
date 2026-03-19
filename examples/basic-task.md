# Basic Task Example

This example demonstrates how to create and execute a simple task using AgentWork.

## 📋 Overview

We'll create a basic content writing task that:
1. Creates a task via CLI
2. Decomposes it into steps
3. Executes each step
4. Produces output

## 🚀 Step-by-Step Guide

### Step 1: Create a Task

```bash
# Navigate to project
cd ~/Desktop/agentwork

# Create a new task
npm run cli -- task create "Write a blog post about AI productivity" -t content -d "Create a 1000-word article about how AI can improve personal productivity"
```

**Output:**
```
✅ 任务已创建：task-abc123
   标题：Write a blog post about AI productivity
   类型：content
```

### Step 2: View Task Details

```bash
npm run cli -- task show task-abc123
```

**Output:**
```
任务详情:
──────────────────────────────────────────────────
ID: task-abc123
标题：Write a blog post about AI productivity
类型：content
状态：pending
创建时间：2026-03-19 22:00:00

执行步骤:
  ⏳ 1. Research topic [web-search]
  ⏳ 2. Create outline [article-outline]
  ⏳ 3. Write article [article-writing]
  ⏳ 4. Review content [content-review]
──────────────────────────────────────────────────
```

### Step 3: Execute the Task

```bash
npm run cli -- task run task-abc123
```

**Output:**
```
🚀 开始执行任务：task-abc123
  ⏳ 步骤开始：Research topic
  ✅ 步骤完成：research
  ⏳ 步骤开始：Create outline
  ✅ 步骤完成：outline
  ⏳ 步骤开始：Write article
  ✅ 步骤完成：writing
  ⏳ 步骤开始：Review content
  ✅ 步骤完成：review

🎉 任务执行完成!
```

### Step 4: View Completed Task

```bash
npm run cli -- task show task-abc123
```

**Output:**
```
任务详情:
──────────────────────────────────────────────────
ID: task-abc123
标题：Write a blog post about AI productivity
类型：content
状态：completed
创建时间：2026-03-19 22:00:00

执行步骤:
  ✅ 1. Research topic [web-search]
  ✅ 2. Create outline [article-outline]
  ✅ 3. Write article [article-writing]
  ✅ 4. Review content [content-review]
──────────────────────────────────────────────────
```

## 💻 Programmatic Usage

You can also create and execute tasks programmatically:

```typescript
// examples/basic-task.ts
import { getAgentWork } from 'agentwork';

async function createBasicTask() {
  // Initialize AgentWork
  const app = await getAgentWork();
  const orchestrator = app.getOrchestrator();
  
  // Create task
  const task = await orchestrator.createTask({
    title: 'Write a blog post about AI productivity',
    type: 'content',
    description: 'Create a 1000-word article'
  });
  
  console.log(`Created task: ${task.id}`);
  
  // Listen to events
  orchestrator.on('step:completed', (event) => {
    console.log(`✅ Step completed: ${event.data.title}`);
  });
  
  orchestrator.on('task:completed', () => {
    console.log('🎉 Task completed!');
  });
  
  // Execute task
  await orchestrator.execute(task.id);
  
  // Get final result
  const finalTask = orchestrator.getTask(task.id);
  console.log(`Final status: ${finalTask?.status}`);
  
  // Access step outputs
  for (const step of finalTask?.steps || []) {
    if (step.output) {
      console.log(`\nStep: ${step.title}`);
      console.log('Output:', JSON.stringify(step.output, null, 2));
    }
  }
}

createBasicTask().catch(console.error);
```

**Run the example:**

```bash
# Build first
npm run build

# Run example
node examples/basic-task.js
```

## 📊 Task Lifecycle

```
┌─────────────┐
│  pending    │ Task created, waiting to start
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ decomposing │ Breaking down into steps
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    ready    │ Steps created, ready to execute
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   running   │ Executing steps
└──────┬──────┘
       │
       ├──────────────┐
       ▼              ▼
┌─────────────┐  ┌─────────────┐
│ completed   │  │   failed    │
└─────────────┘  └─────────────┘
```

## 🎯 Task Types

AgentWork supports different task types:

| Type | Description | Example |
|------|-------------|---------|
| `content` | Content creation | Write article, create post |
| `dev` | Development tasks | Fix bug, write code |
| `research` | Research tasks | Market analysis, data gathering |
| `custom` | Custom workflow | User-defined process |

### Creating Different Task Types

```bash
# Content task
npm run cli -- task create "Write product description" -t content

# Development task
npm run cli -- task create "Fix login bug" -t dev

# Research task
npm run cli -- task create "Research competitors" -t research

# Custom task with workflow
npm run cli -- task create "Onboard new customer" -t custom -w onboarding
```

## 🔍 Listing Tasks

```bash
# List recent tasks (default 20)
npm run cli -- task list

# List specific number
npm run cli -- task list -l 10
```

**Output:**
```
任务列表:
────────────────────────────────────────────────────────────────
✅ abc12345 | Write a blog post about AI productivity | completed
🔄 def67890 | Fix login bug | running
⏳ ghi11111 | Research competitors | pending
❌ jkl22222 | Update documentation | failed
────────────────────────────────────────────────────────────────
```

## ⚠️ Error Handling

If a task fails, check the failed step:

```bash
npm run cli -- task show task-abc123
```

Look for steps with ❌ status and check the error message.

### Common Issues

**1. Skill Not Found**
```
Error: Skill 'article-writing' not found
```
**Solution:** Install the required skill:
```bash
npm run cli -- skill install ./skills/article-writing
```

**2. Invalid Input**
```
Error: Missing required parameter 'topic'
```
**Solution:** Provide all required parameters in task description.

**3. Execution Timeout**
```
Error: Step execution timeout
```
**Solution:** Check if the skill is hanging or needs more resources.

## 📚 Next Steps

- [Content Workflow Example](./content-workflow.md) - Multi-step workflow
- [Custom Skill Example](./custom-skill.md) - Create your own skill
- [Workflow Definition Guide](../docs/workflows.md) - Define custom workflows
