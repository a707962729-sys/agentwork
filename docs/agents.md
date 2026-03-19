# Agent Configuration Guide

Agents are AI-powered workers that execute skills and complete tasks within workflows.

## 📋 What is an Agent?

An agent is a configured AI instance with:
- Specific model assignment
- Skill access
- Tool permissions
- Persona and behavior settings

## 📁 Agent File Structure

```yaml
# agents/my-agent.yaml
id: agent-id
name: "Human Readable Name"
description: "What this agent does"

model: model-name

skills:
  - skill-1
  - skill-2

tools:
  allow: [tool-1, tool-2]
  deny: [tool-3]

persona:
  tone: "professional | casual | friendly"
  style: "description of communication style"
  expertise: ["area1", "area2"]
```

## 🔧 Complete Example

```yaml
# agents/content-writer.yaml
id: content-writer
name: "Content Writer"
description: "Specialized in creating high-quality written content"

model: qwen-cn/qwen3.5-plus

skills:
  - article-writing
  - article-outline
  - web-search
  - content-review

tools:
  allow: [read, write, web_search, browser]
  deny: [exec, message]

persona:
  tone: "professional"
  style: "Clear, engaging writing with proper structure"
  expertise: ["content creation", "research", "editing"]
```

## 📝 Configuration Fields

### Basic Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Display name |
| `description` | string | No | Agent description |

### Model Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | AI model identifier |

Common models:
- `qwen-cn/qwen3.5-plus` - Qwen 3.5 Plus
- `qwen-cn/glm-5` - GLM 5
- `openai/gpt-4` - GPT-4

### Skills

List of skills the agent can use:

```yaml
skills:
  - article-writing
  - web-search
  - image-gen
```

### Tools

Control which tools the agent can access:

```yaml
tools:
  allow: [read, write, edit, web_search]
  deny: [exec, message]
```

Available tools:
- `read` - Read files
- `write` - Write files
- `edit` - Edit files
- `exec` - Execute commands
- `web_search` - Search the web
- `browser` - Control browser
- `message` - Send messages

### Persona

Define agent behavior:

```yaml
persona:
  tone: "professional"
  style: "Structured thinking, clear expression"
  expertise: ["task management", "process optimization"]
```

## 🎯 Agent Types

### Coordinator Agent

```yaml
id: coordinator
name: "Coordinator"
description: "Task decomposition and coordination"

model: qwen-cn/qwen3.5-plus

skills:
  - task-decompose

tools:
  allow: [read, write, edit, web_search, sessions_spawn, sessions_send]
  deny: []

persona:
  tone: "professional, efficient"
  style: "Structured thinking, clear expression"
  expertise: ["task management", "process optimization", "resource allocation"]
```

### Content Writer Agent

```yaml
id: content-writer
name: "Content Writer"
description: "Creates high-quality written content"

model: qwen-cn/qwen3.5-plus

skills:
  - article-writing
  - article-outline
  - web-search

tools:
  allow: [read, write, web_search]
  deny: [exec, message]

persona:
  tone: "creative"
  style: "Engaging, well-structured writing"
  expertise: ["content creation", "research", "editing"]
```

### Developer Agent

```yaml
id: developer
name: "Developer"
description: "Software development and code review"

model: qwen-cn/glm-5

skills:
  - code-review
  - bug-fix
  - test-gen

tools:
  allow: [read, write, edit, exec]
  deny: []

persona:
  tone: "technical"
  style: "Precise, detail-oriented"
  expertise: ["software development", "code quality", "testing"]
```

### Reviewer Agent

```yaml
id: reviewer
name: "Reviewer"
description: "Content quality review and approval"

model: qwen-cn/qwen3.5-plus

skills:
  - content-review
  - quality-check

tools:
  allow: [read, write]
  deny: [exec]

persona:
  tone: "critical"
  style: "Detail-oriented, constructive feedback"
  expertise: ["quality assurance", "content review", "editing"]
```

## 🔧 Using Agents in Workflows

Reference agents in workflow steps:

```yaml
steps:
  - id: writing
    name: "Write Article"
    skill: article-writing
    agent: content-writer  # ← Reference agent here
    input:
      topic: "${inputs.topic}"
    checkpoint:
      validate: "output.wordCount >= 500"
```

## 🎛️ Model Selection

### Choosing the Right Model

| Use Case | Recommended Model |
|----------|------------------|
| General tasks | qwen-cn/qwen3.5-plus |
| Complex reasoning | qwen-cn/glm-5 |
| Creative writing | qwen-cn/qwen3.5-plus |
| Code generation | qwen-cn/glm-5 |
| Quick tasks | lighter models |

### Model Configuration

```yaml
# Use specific model for agent
model: qwen-cn/qwen3.5-plus

# Or use default from config
# (omit model field to use default)
```

## 🧪 Testing Agents

### Manual Testing

```bash
# Create a task assigned to specific agent
npm run cli -- task create "Write a blog post" -t content

# Run and observe agent behavior
npm run cli -- task run <task-id>
```

### Agent Output Inspection

Check task execution logs to see:
- Agent decision-making
- Tool usage
- Skill execution results

## 📊 Agent Registry API

```typescript
import { getAgentWork } from 'agentwork';

const app = await getAgentWork();
const registry = app.getAgentRegistry();

// List all agents
const agents = registry.list();

// Get agent by ID
const agent = registry.get('content-writer');

// Check agent capabilities
const skills = agent.getSkills();
const tools = agent.getAllowedTools();
```

## 🎯 Best Practices

1. **Single Responsibility**: Each agent should have a clear focus
2. **Appropriate Skills**: Only grant skills the agent needs
3. **Tool Security**: Deny tools that aren't necessary
4. **Clear Persona**: Define tone and style explicitly
5. **Model Matching**: Choose models based on task complexity
6. **Documentation**: Document agent purpose and capabilities

## 🔄 Agent Communication

Agents can communicate through the orchestrator:

```typescript
// In orchestrator
const coordinator = app.getAgent('coordinator');
const writer = app.getAgent('content-writer');

// Coordinator can spawn sub-agents
await coordinator.spawn({
  target: 'content-writer',
  task: 'Write article about AI'
});
```

## 📚 Examples

See workflow examples for agent usage patterns:
- `/examples/content-workflow.md` - Content creation agents
- `/examples/basic-task.md` - Simple agent assignment

## 🆘 Troubleshooting

### Agent Not Found

- Check agent YAML syntax
- Verify agent file is in `agents/` directory
- Ensure agent ID matches workflow reference

### Tool Permission Errors

- Check `tools.allow` list
- Verify tool name is correct
- Consider security implications before adding tools

### Skill Execution Fails

- Verify agent has the skill in its `skills` list
- Check skill is installed and available
- Review skill input requirements
