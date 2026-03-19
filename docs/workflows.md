# Workflow Definition Guide

Workflows define automated processes that combine skills and agents to accomplish complex tasks.

## 📋 What is a Workflow?

A workflow is a YAML-defined sequence of steps that:
- Takes input parameters
- Executes skills in order (or parallel)
- Validates results at checkpoints
- Produces structured outputs

## 📁 Workflow File Structure

```yaml
# workflows/my-workflow.yaml
apiVersion: company/v1
kind: Workflow

metadata:
  id: unique-id
  name: "Human Readable Name"
  description: "What this workflow does"
  version: "1.0.0"
  author: your-name
  tags: [tag1, tag2]

triggers:
  - type: manual
  - type: schedule
    cron: "0 9 * * *"

inputs:
  paramName:
    type: string | number | boolean | object
    required: true | false
    default: value
    description: "Parameter description"
    enum: [allowed, values]

steps:
  - id: step-id
    name: "Step Name"
    skill: skill-name
    agent: agent-id (optional)
    dependsOn: [other-step-ids] (optional)
    input:
      key: "${inputs.paramName}" or "${steps.other-step.output}"
    checkpoint:
      validate: "expression"
      onError: retry | abort | continue
      maxRetries: 3
      requireApproval: true | false

outputs:
  outputName: "${steps.step-id.output.field}"
```

## 🔧 Complete Example

```yaml
# workflows/content-publish.yaml
apiVersion: company/v1
kind: Workflow

metadata:
  id: content-publish
  name: "Content Publishing Pipeline"
  description: "From topic to published article"
  version: "1.0.0"
  tags: [content, publishing]

triggers:
  - type: manual
  - type: schedule
    cron: "0 9 * * *"

inputs:
  topic:
    type: string
    required: true
    description: "Article topic"
  style:
    type: string
    default: "professional"
    enum: ["professional", "casual", "humorous"]
  auto_publish:
    type: boolean
    default: false

steps:
  # Step 1: Research
  - id: research
    name: "Research Topic"
    skill: web-search
    input:
      query: "${inputs.topic} latest trends"
    checkpoint:
      validate: "output.results.length >= 1"
      onError: retry
      maxRetries: 2

  # Step 2: Create Outline
  - id: outline
    name: "Create Outline"
    skill: article-outline
    agent: content-writer
    dependsOn: [research]
    input:
      topic: "${inputs.topic}"
      context: "${steps.research.output}"
    checkpoint:
      validate: "output.sections.length >= 3"

  # Step 3: Write Article
  - id: writing
    name: "Write Article"
    skill: article-writing
    agent: content-writer
    dependsOn: [outline]
    input:
      topic: "${inputs.topic}"
      style: "${inputs.style}"
      outline: "${steps.outline.output}"
    checkpoint:
      validate: "output.wordCount >= 500"
      onError: retry

  # Step 4: Review
  - id: review
    name: "Content Review"
    skill: content-review
    agent: reviewer
    dependsOn: [writing]
    checkpoint:
      requireApproval: true
      onReject:
        goto: writing
        message: "Please revise based on feedback"

  # Step 5: Generate Cover (parallel)
  - id: cover
    name: "Generate Cover Image"
    skill: image-gen
    agent: image-generator
    input:
      prompt: "Cover image for: ${inputs.topic}"
    # No dependsOn - runs in parallel with writing

  # Step 6: Publish
  - id: publish
    name: "Publish Content"
    skill: wechat-publish
    agent: publisher
    dependsOn: [review, cover]
    input:
      article: "${steps.writing.output}"
      cover: "${steps.cover.output}"
      auto_publish: "${inputs.auto_publish}"
    checkpoint:
      validate: "output.success == true"

outputs:
  articleUrl: "${steps.publish.output.url}"
  previewUrl: "${steps.publish.output.previewUrl}"
```

## 📝 Input Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text value | `"hello"` |
| `number` | Numeric value | `42` |
| `boolean` | True/false | `true` |
| `object` | Complex object | `{key: "value"}` |
| `array` | List of values | `[1, 2, 3]` |

## 🎯 Step Configuration

### Basic Step

```yaml
- id: simple-step
  name: "Simple Step"
  skill: my-skill
  input:
    param: "value"
```

### Step with Dependencies

```yaml
- id: dependent-step
  name: "Dependent Step"
  skill: my-skill
  dependsOn: [previous-step-1, previous-step-2]
  input:
    data: "${steps.previous-step-1.output}"
```

### Step with Agent

```yaml
- id: agent-step
  name: "Agent Step"
  skill: my-skill
  agent: content-writer
  input:
    task: "${inputs.task}"
```

## ✅ Checkpoint Configuration

### Validation Expression

```yaml
checkpoint:
  validate: "output.success == true"
  onError: retry
  maxRetries: 3
```

### Manual Approval

```yaml
checkpoint:
  requireApproval: true
  onReject:
    goto: previous-step
    message: "Please revise"
```

### Error Handling

```yaml
checkpoint:
  validate: "output.valid"
  onError: abort  # Options: retry, abort, continue
  maxRetries: 2
```

## 🔄 Execution Flow

### Sequential Execution

Steps execute in order unless `dependsOn` specifies otherwise:

```yaml
steps:
  - id: step1  # Runs first
    skill: skill-a
  
  - id: step2  # Runs after step1
    skill: skill-b
    dependsOn: [step1]
  
  - id: step3  # Runs after step2
    skill: skill-c
    dependsOn: [step2]
```

### Parallel Execution

Steps without dependencies run in parallel:

```yaml
steps:
  - id: step1
    skill: skill-a
  
  - id: step2  # Runs parallel with step1
    skill: skill-b
  
  - id: step3  # Waits for both
    skill: skill-c
    dependsOn: [step1, step2]
```

## 📤 Output Mapping

Map step outputs to workflow outputs:

```yaml
outputs:
  finalResult: "${steps.final-step.output.result}"
  metadata:
    url: "${steps.publish.output.url}"
    id: "${steps.publish.output.id}"
```

## 🎛️ Triggers

### Manual Trigger

```yaml
triggers:
  - type: manual
```

### Scheduled Trigger

```yaml
triggers:
  - type: schedule
    cron: "0 9 * * *"  # Every day at 9 AM
```

### Cron Examples

- `0 9 * * *` - Daily at 9 AM
- `0 9 * * 1` - Every Monday at 9 AM
- `0 */2 * * *` - Every 2 hours
- `0 0 1 * *` - First day of each month

## 🔧 Workflow Management CLI

### List Workflows

```bash
npm run cli -- workflow list
```

### Run Workflow

```bash
npm run cli -- workflow run content-publish \
  --param topic="AI Agents" \
  --param style="professional"
```

### Install Workflow

```bash
npm run cli -- workflow install ./workflows/my-workflow.yaml
```

## 🧪 Testing Workflows

### Dry Run

```bash
npm run cli -- workflow run my-workflow --param key=value --dry-run
```

### Debug Mode

```bash
npm run cli -- workflow run my-workflow --debug
```

## 📚 Workflow API

```typescript
import { getAgentWork } from 'agentwork';

const app = await getAgentWork();
const engine = app.getWorkflowEngine();

// List workflows
const workflows = engine.listWorkflows();

// Run workflow
const run = await engine.run('content-publish', {
  topic: "AI",
  style: "professional"
});

// Get run status
const status = engine.getRunStatus(run.id);

// Load from file
const workflow = await engine.loadFromFile('./my-workflow.yaml');
```

## 🎯 Best Practices

1. **Modular Design**: Keep workflows focused on one process
2. **Clear Naming**: Use descriptive IDs and names
3. **Documentation**: Add descriptions to all inputs and steps
4. **Error Handling**: Define checkpoint behaviors for failures
5. **Testing**: Test workflows with various inputs
6. **Versioning**: Version your workflows for tracking changes

## 📚 Examples

See `/examples/content-workflow.md` for complete workflow examples.

## 🆘 Troubleshooting

### Workflow Not Loading

- Check YAML syntax
- Verify `apiVersion` and `kind` fields
- Ensure all referenced skills exist

### Step Fails

- Check input parameter mapping
- Review checkpoint validation expression
- Examine skill output format

### Circular Dependencies

Ensure `dependsOn` doesn't create circular references.
