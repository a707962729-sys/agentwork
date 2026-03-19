# Getting Started with AgentWork

Welcome to AgentWork - your one-person company automation platform!

## 📦 Installation

### Prerequisites

- Node.js >= 18
- npm or yarn
- OpenClaw (optional, for skill compatibility)

### Step 1: Clone and Install

```bash
cd ~/Desktop/agentwork
npm install
npm run build
```

### Step 2: Verify Installation

```bash
npm run cli -- --version
```

You should see the AgentWork version number.

### Step 3: (Optional) Configure OpenClaw Integration

AgentWork is compatible with OpenClaw skills. If you have OpenClaw installed:

```bash
# AgentWork will automatically load skills from:
# - ./skills/ (local skills)
# - ~/.openclaw/skills/ (OpenClaw skills)
```

## 🚀 Quick Start

### Create Your First Task

```bash
# Create a task
npm run cli -- task create "Write an article about AI Agents" -t content

# View the task
npm run cli -- task show <task-id>

# Execute the task
npm run cli -- task run <task-id>
```

### Run a Workflow

```bash
# List available workflows
npm run cli -- workflow list

# Run a workflow with parameters
npm run cli -- workflow run content-publish --param topic="AI Agent" --param style="professional"
```

### Manage Skills

```bash
# List installed skills
npm run cli -- skill list

# Install a new skill
npm run cli -- skill install ./skills/my-skill

# Search for skills
npm run cli -- skill search "writing"
```

## 📚 Next Steps

- [Skills Development Guide](./skills.md) - Learn how to create custom skills
- [Workflow Definition Guide](./workflows.md) - Define your automation workflows
- [Agent Configuration Guide](./agents.md) - Configure AI agents
- [API Reference](./api.md) - Complete API documentation

## 💡 Example Use Cases

### Content Creation Pipeline

```bash
# Automated content creation and publishing
npm run cli -- workflow run content-publish \
  --param topic="The Future of AI" \
  --param style="professional" \
  --param auto_publish=true
```

### Development Pipeline

```bash
# Code review and testing workflow
npm run cli -- workflow run dev-pipeline \
  --param repo="my-project" \
  --param branch="main"
```

## 🔧 Configuration

Edit `config.yaml` to customize:

- Default AI models
- Database settings
- Skill paths
- Workflow directories

```yaml
# config.yaml
model:
  default: qwen-cn/qwen3.5-plus
  
database:
  path: ./data/agentwork.db
  
skills:
  paths:
    - ./skills
    - ~/.openclaw/skills
```

## 🆘 Troubleshooting

### Build Errors

```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

### Skill Not Found

Ensure the skill directory contains a valid `SKILL.md` file.

### Workflow Execution Fails

Check the workflow YAML syntax and ensure all referenced skills are installed.

## 📞 Support

- Documentation: `/docs` directory
- Examples: `/examples` directory
- Issues: Create a task with type "bug"
