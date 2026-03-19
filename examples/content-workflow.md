# Content Workflow Example

This example demonstrates a complete content creation and publishing workflow.

## 📋 Overview

The content publishing workflow automates:
1. Topic research
2. Outline creation
3. Article writing
4. Content review
5. Cover image generation
6. Publishing to platforms

## 📁 Workflow Definition

```yaml
# workflows/content-publish.yaml
apiVersion: company/v1
kind: Workflow

metadata:
  id: content-publish
  name: "内容发布流程"
  description: "从选题到发布的完整内容创作流程"
  version: "1.0.0"
  tags: [content, publishing, wechat]

triggers:
  - type: manual
  - type: schedule
    cron: "0 9 * * *"

inputs:
  topic:
    type: string
    required: true
    description: "文章主题"
  style:
    type: string
    default: "专业"
    enum: ["专业", "轻松", "幽默"]
  auto_publish:
    type: boolean
    default: false

steps:
  - id: research
    name: "资料调研"
    skill: web-search
    input:
      query: "${inputs.topic} 最新趋势"
    checkpoint:
      validate: "output.results.length >= 1"
      onError: retry
      maxRetries: 2

  - id: outline
    name: "大纲设计"
    skill: article-outline
    agent: content-writer
    dependsOn: [research]
    input:
      topic: "${inputs.topic}"
      context: "${steps.research.output}"
    checkpoint:
      validate: "output.sections.length >= 3"

  - id: writing
    name: "正文撰写"
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

  - id: review
    name: "内容审核"
    skill: content-review
    agent: reviewer
    dependsOn: [writing]
    checkpoint:
      requireApproval: true
      onReject:
        goto: writing
        message: "请根据审核意见修改"

  - id: cover
    name: "生成封面"
    skill: image-gen
    agent: image-generator
    input:
      prompt: "文章封面：${inputs.topic}"

  - id: publish
    name: "发布内容"
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

## 🚀 Running the Workflow

### Basic Usage

```bash
# Run with required parameter
npm run cli -- workflow run content-publish --param topic="AI Agent 技术详解"
```

### With All Parameters

```bash
# Run with all parameters
npm run cli -- workflow run content-publish \
  --param topic="AI Agent 技术详解" \
  --param style="专业" \
  --param auto_publish=true
```

### Output

```
🚀 运行工作流：content-publish
   参数：{"topic":"AI Agent 技术详解","style":"专业","auto_publish":true}

✅ 工作流已启动：run-xyz789
```

## 📊 Workflow Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    content-publish workflow                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    research     │
                    │   (web-search)  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     outline     │
                    │ (article-outline)│
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌─────────────────┐           ┌─────────────────┐
     │     writing     │           │      cover      │
     │ (article-writing)│           │   (image-gen)   │
     └────────┬────────┘           └────────┬────────┘
              │                             │
              ▼                             │
     ┌─────────────────┐                    │
     │      review     │                    │
     │ (content-review)│                    │
     └────────┬────────┘                    │
              │                             │
              └──────────────┬──────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     publish     │
                    │ (wechat-publish)│
                    └─────────────────┘
```

## 💻 Programmatic Usage

```typescript
// examples/content-workflow.ts
import { getAgentWork } from 'agentwork';

async function runContentWorkflow() {
  const app = await getAgentWork();
  const engine = app.getWorkflowEngine();
  
  // Define inputs
  const inputs = {
    topic: 'AI Agent 技术详解',
    style: '专业',
    auto_publish: true
  };
  
  console.log('🚀 Starting content publishing workflow...');
  console.log('Inputs:', inputs);
  
  try {
    // Run workflow
    const run = await engine.run('content-publish', inputs);
    
    console.log(`\n✅ Workflow started: ${run.id}`);
    
    // Monitor progress (polling)
    let status = engine.getRunStatus(run.id);
    
    while (status.status === 'running') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      status = engine.getRunStatus(run.id);
      
      console.log(`\nProgress: ${status.status}`);
      console.log('Completed steps:', Object.keys(status.stepResults).length);
      
      // Log step results
      for (const [stepId, result] of Object.entries(status.stepResults)) {
        if (result.status === 'completed') {
          console.log(`  ✅ ${stepId}`);
        } else if (result.status === 'failed') {
          console.log(`  ❌ ${stepId}: ${result.error}`);
        }
      }
    }
    
    // Final result
    if (status.status === 'completed') {
      console.log('\n🎉 Workflow completed successfully!');
      console.log('Outputs:', status.outputs);
    } else if (status.status === 'failed') {
      console.log('\n❌ Workflow failed:', status.error);
    }
    
  } catch (error: any) {
    console.error('Error running workflow:', error.message);
  }
}

runContentWorkflow().catch(console.error);
```

**Run the example:**

```bash
npm run build
node examples/content-workflow.js
```

## 🎯 Step Details

### Step 1: Research

**Skill:** `web-search`

**Purpose:** Gather information about the topic

**Input:**
```json
{
  "query": "AI Agent 技术详解 最新趋势"
}
```

**Output:**
```json
{
  "results": [
    {
      "title": "Article title",
      "url": "https://...",
      "snippet": "Summary..."
    }
  ]
}
```

**Checkpoint:**
- At least 1 result required
- Retry up to 2 times on failure

### Step 2: Outline

**Skill:** `article-outline`

**Agent:** `content-writer`

**Purpose:** Create article structure

**Input:**
```json
{
  "topic": "AI Agent 技术详解",
  "context": "${steps.research.output}"
}
```

**Output:**
```json
{
  "title": "Article Title",
  "sections": [
    "Introduction",
    "Main Point 1",
    "Main Point 2",
    "Conclusion"
  ]
}
```

**Checkpoint:**
- At least 3 sections required

### Step 3: Writing

**Skill:** `article-writing`

**Agent:** `content-writer`

**Purpose:** Write the full article

**Input:**
```json
{
  "topic": "AI Agent 技术详解",
  "style": "专业",
  "outline": "${steps.outline.output}"
}
```

**Output:**
```json
{
  "title": "Article Title",
  "content": "Full article content...",
  "wordCount": 1200,
  "sections": [...]
}
```

**Checkpoint:**
- Minimum 500 words
- Retry on failure

### Step 4: Review

**Skill:** `content-review`

**Agent:** `reviewer`

**Purpose:** Quality check

**Input:**
```json
{
  "article": "${steps.writing.output}"
}
```

**Output:**
```json
{
  "approved": true,
  "feedback": "Great article!",
  "suggestions": [...]
}
```

**Checkpoint:**
- Requires manual approval
- On reject: go back to writing step

### Step 5: Cover Image

**Skill:** `image-gen`

**Agent:** `image-generator`

**Purpose:** Generate cover image

**Input:**
```json
{
  "prompt": "文章封面：AI Agent 技术详解"
}
```

**Output:**
```json
{
  "imageUrl": "https://...",
  "imagePath": "./images/cover.png"
}
```

**Note:** This step runs in parallel with writing

### Step 6: Publish

**Skill:** `wechat-publish`

**Agent:** `publisher`

**Purpose:** Publish to platform

**Input:**
```json
{
  "article": "${steps.writing.output}",
  "cover": "${steps.cover.output}",
  "auto_publish": true
}
```

**Output:**
```json
{
  "success": true,
  "url": "https://...",
  "previewUrl": "https://..."
}
```

## 🔧 Customization

### Modify for Different Platforms

Create a new workflow for different publishing platforms:

```yaml
# workflows/zhihu-publish.yaml
apiVersion: company/v1
kind: Workflow

metadata:
  id: zhihu-publish
  name: "知乎发布流程"

# ... same steps, different publish step ...

steps:
  # ... research, outline, writing, review ...
  
  - id: publish
    name: "发布到知乎"
    skill: zhihu-publish
    agent: publisher
    dependsOn: [review, cover]
    input:
      article: "${steps.writing.output}"
      cover: "${steps.cover.output}"
```

### Add SEO Optimization Step

```yaml
steps:
  # ... previous steps ...
  
  - id: seo
    name: "SEO 优化"
    skill: seo-optimize
    dependsOn: [writing]
    input:
      article: "${steps.writing.output}"
      keywords: ["AI", "Agent", "自动化"]
    checkpoint:
      validate: "output.score >= 80"
  
  - id: publish
    name: "发布内容"
    skill: wechat-publish
    dependsOn: [review, cover, seo]
    input:
      article: "${steps.seo.output}"
```

### Add Social Media Promotion

```yaml
steps:
  # ... publish step ...
  
  - id: promote
    name: "社交媒体推广"
    skill: social-promote
    dependsOn: [publish]
    input:
      url: "${steps.publish.output.url}"
      platforms: ["twitter", "linkedin", "wechat"]
```

## 📈 Monitoring and Debugging

### Check Workflow Status

```bash
# List workflow runs
npm run cli -- workflow runs content-publish
```

### Debug Mode

```bash
# Run with debug output
npm run cli -- workflow run content-publish \
  --param topic="Test" \
  --debug
```

### View Run Details

```typescript
const engine = app.getWorkflowEngine();
const run = engine.getRunStatus('run-xyz789');

console.log('Run Details:');
console.log('Status:', run.status);
console.log('Started:', run.startedAt);
console.log('Completed:', run.completedAt);
console.log('Steps:', Object.keys(run.stepResults));

for (const [stepId, result] of Object.entries(run.stepResults)) {
  console.log(`\nStep: ${stepId}`);
  console.log('  Status:', result.status);
  console.log('  Output:', result.output);
  if (result.error) {
    console.log('  Error:', result.error);
  }
}
```

## 📚 Related Examples

- [Basic Task Example](./basic-task.md) - Simple task creation
- [Custom Skill Example](./custom-skill.md) - Create custom skills
- [Workflow Definition Guide](../docs/workflows.md) - Complete workflow guide
