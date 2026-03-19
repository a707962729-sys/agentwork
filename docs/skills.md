# Skills Development Guide

Skills are the building blocks of AgentWork. This guide shows you how to create, install, and use skills.

## 📋 What is a Skill?

A skill is a reusable capability that can be used by agents and workflows. Skills are fully compatible with OpenClaw's SKILL.md format.

## 📁 Skill Structure

```
my-skill/
├── SKILL.md          # Required: Skill manifest and documentation
├── index.js          # Optional: Implementation code
├── package.json      # Optional: Dependencies
└── assets/           # Optional: Images, templates, etc.
```

## 📝 SKILL.md Format

```markdown
---
name: skill-name
description: "Clear description of what the skill does"
metadata:
  category: content | dev | ops | media
  triggers: ["trigger phrase 1", "trigger phrase 2"]
  author: your-name
  version: "1.0.0"
---

# Skill Documentation

## Overview
Brief description of the skill's purpose.

## Features
- Feature 1
- Feature 2
- Feature 3

## Input Parameters
- `param1`: Description (required/optional, default value)
- `param2`: Description (required/optional, default value)

## Output Format
```json
{
  "field": "description"
}
```

## Usage Examples
```bash
# Example usage
node cli.js skill run skill-name --param key=value
```

## Dependencies
List any external dependencies or requirements.
```

## 🔨 Creating a Skill

### Step 1: Create Directory

```bash
mkdir -p skills/my-skill
cd skills/my-skill
```

### Step 2: Create SKILL.md

```markdown
---
name: my-skill
description: "My custom skill for doing something useful"
metadata:
  category: content
  triggers: ["do something", "my task"]
  author: me
  version: "1.0.0"
---

# My Skill

## Overview
This skill helps me accomplish a specific task.

## Input Parameters
- `input`: The input data (required)
- `options`: Configuration options (optional)

## Output
Returns processed results.
```

### Step 3: (Optional) Add Implementation

If your skill needs custom logic:

```javascript
// index.js
export async function execute(input, context) {
  // Your implementation
  return {
    success: true,
    result: "processed data"
  };
}
```

## 📦 Installing Skills

### Install from Local Path

```bash
npm run cli -- skill install ./skills/my-skill
```

### Install from OpenClaw

Skills in `~/.openclaw/skills/` are automatically available.

### Install from Remote

```bash
npm run cli -- skill install https://github.com/user/skill-repo
```

## 🔍 Using Skills in Workflows

Reference skills in your workflow YAML:

```yaml
steps:
  - id: my-step
    name: "Execute Skill"
    skill: my-skill
    input:
      param1: "${inputs.value}"
      param2: "static value"
    checkpoint:
      validate: "output.success == true"
```

## 🔍 Using Skills in Agents

Reference skills in agent configuration:

```yaml
# agents/my-agent.yaml
id: my-agent
name: "My Agent"

skills:
  - my-skill
  - another-skill

tools:
  allow: [read, write, web_search]
```

## 🧪 Testing Skills

### Manual Testing

```bash
# Create a test task
npm run cli -- task create "Test my skill" -t custom

# Run and observe output
npm run cli -- task run <task-id>
```

### Automated Testing

```javascript
// test/my-skill.test.js
import { describe, it, expect } from 'vitest';
import { execute } from '../skills/my-skill/index.js';

describe('my-skill', () => {
  it('should process input correctly', async () => {
    const result = await execute({ input: 'test' });
    expect(result.success).toBe(true);
  });
});
```

## 📊 Skill Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `content` | Content creation | article-writing, image-gen |
| `dev` | Development | code-review, bug-fix |
| `ops` | Operations | deploy, monitor |
| `media` | Media processing | video-edit, audio-transcribe |

## 🎯 Best Practices

1. **Single Responsibility**: Each skill should do one thing well
2. **Clear Documentation**: Document all inputs, outputs, and behaviors
3. **Error Handling**: Handle errors gracefully and provide clear messages
4. **Validation**: Validate inputs before processing
5. **Testing**: Write tests for critical functionality
6. **Versioning**: Use semantic versioning in metadata

## 🔧 Skill Registry API

Programmatically manage skills:

```typescript
import { getAgentWork } from 'agentwork';

const app = await getAgentWork();
const registry = app.getSkillsRegistry();

// List all skills
const skills = registry.list();

// Search skills
const results = registry.search('writing');

// Install skill
const skill = await registry.install('./my-skill');

// Get skill by name
const skill = registry.get('article-writing');
```

## 📚 Examples

See `/examples/custom-skill.md` for a complete example.

## 🆘 Troubleshooting

### Skill Not Loading

- Check SKILL.md syntax
- Ensure required fields are present
- Verify category is valid

### Skill Execution Fails

- Check input parameters match expected format
- Review error messages in logs
- Test skill in isolation first
