# Custom Skill Example

This example shows how to create a custom skill from scratch.

## 📋 Overview

We'll create a skill that:
- Takes input text
- Processes it (e.g., summarizes, translates, or analyzes)
- Returns structured output

## 🎯 Example: Text Summarizer Skill

### Step 1: Create Directory Structure

```bash
cd ~/Desktop/agentwork
mkdir -p skills/text-summarizer
cd skills/text-summarizer
```

### Step 2: Create SKILL.md

Create `skills/text-summarizer/SKILL.md`:

```markdown
---
name: text-summarizer
description: "文本摘要技能 - 将长文本压缩为简洁的摘要"
metadata:
  category: content
  triggers: ["总结", "摘要", "summarize", "概括"]
  author: agentwork
  version: "1.0.0"
---

# 文本摘要技能

## 功能
将长篇文章、文档或文本内容压缩为简洁的摘要，保留关键信息。

## 支持的摘要类型
- 抽取式摘要（提取关键句子）
- 生成式摘要（重新组织语言）
- 要点式摘要（bullet points）

## 输入参数
- `text`: 要摘要的文本（必填）
- `length`: 摘要长度（可选：short/medium/long，默认 medium）
- `style`: 摘要风格（可选：extractive/generative/bullet，默认 generative）
- `language`: 输出语言（可选：zh/en，默认与输入一致）

## 输出格式
```json
{
  "summary": "摘要内容",
  "originalLength": 1000,
  "summaryLength": 200,
  "compressionRatio": 0.2,
  "keyPoints": ["关键点 1", "关键点 2"]
}
```

## 使用示例

### CLI 使用
```bash
npm run cli -- skill run text-summarizer \
  --text "长文本内容..." \
  --length short
```

### 在工作流中使用
```yaml
steps:
  - id: summarize
    name: "摘要生成"
    skill: text-summarizer
    input:
      text: "${inputs.article}"
      length: "medium"
    checkpoint:
      validate: "output.summaryLength > 0"
```

## 依赖
- 需要配置 AI 模型（默认使用 qwen-cn/qwen3.5-plus）

### Step 3: (Optional) Add Implementation

For skills that need custom logic, create `index.js`:

```javascript
// skills/text-summarizer/index.js
import { getAgentWork } from 'agentwork';

/**
 * Execute the text summarizer skill
 * @param {Object} input - Input parameters
 * @param {string} input.text - Text to summarize
 * @param {string} input.length - Summary length (short/medium/long)
 * @param {string} input.style - Summary style (extractive/generative/bullet)
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Summary result
 */
export async function execute(input, context) {
  const { text, length = 'medium', style = 'generative' } = input;
  
  if (!text || typeof text !== 'string') {
    throw new Error('Text parameter is required and must be a string');
  }
  
  // Get AgentWork instance for AI capabilities
  const app = await getAgentWork();
  
  // Define prompt based on style
  const prompts = {
    extractive: `Extract the 3-5 most important sentences from this text:\n\n${text}`,
    generative: `Summarize the following text in ${length} length. Keep key information:\n\n${text}`,
    bullet: `Create bullet point summary of this text. List 5-7 key points:\n\n${text}`
  };
  
  const prompt = prompts[style] || prompts.generative;
  
  // Use AI to generate summary (via orchestrator or direct API)
  const orchestrator = app.getOrchestrator();
  
  const summaryTask = await orchestrator.createTask({
    title: 'Summarize text',
    type: 'content',
    description: prompt
  });
  
  await orchestrator.execute(summaryTask.id);
  
  const completedTask = orchestrator.getTask(summaryTask.id);
  const summary = completedTask?.steps[0]?.output?.content || prompt;
  
  // Calculate metrics
  const originalLength = text.length;
  const summaryLength = summary.length;
  const compressionRatio = summaryLength / originalLength;
  
  // Extract key points (simple sentence splitting)
  const keyPoints = summary
    .split(/[。！？.!?]/)
    .filter(s => s.trim().length > 10)
    .slice(0, 5)
    .map(s => s.trim());
  
  return {
    success: true,
    summary: summary.trim(),
    originalLength,
    summaryLength,
    compressionRatio: Math.round(compressionRatio * 100) / 100,
    keyPoints
  };
}

/**
 * Validate input parameters
 * @param {Object} input - Input to validate
 * @returns {Object} Validation result
 */
export function validate(input) {
  const errors = [];
  
  if (!input.text) {
    errors.push('Text parameter is required');
  } else if (typeof input.text !== 'string') {
    errors.push('Text must be a string');
  } else if (input.text.length < 50) {
    errors.push('Text is too short to summarize (minimum 50 characters)');
  }
  
  if (input.length && !['short', 'medium', 'long'].includes(input.length)) {
    errors.push('Length must be one of: short, medium, long');
  }
  
  if (input.style && !['extractive', 'generative', 'bullet'].includes(input.style)) {
    errors.push('Style must be one of: extractive, generative, bullet');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Step 4: Install the Skill

```bash
# From project root
npm run cli -- skill install ./skills/text-summarizer
```

**Output:**
```
✅ 已安装技能：text-summarizer
```

### Step 5: Test the Skill

#### Test via CLI

```bash
# Create a test task
npm run cli -- task create "Summarize this article" -t custom

# Or run skill directly (if supported)
npm run cli -- skill run text-summarizer \
  --text "Artificial intelligence is transforming industries worldwide..." \
  --length short \
  --style generative
```

#### Test Programmatically

Create test file `test/text-summarizer.test.js`:

```javascript
// test/text-summarizer.test.js
import { describe, it, expect } from 'vitest';
import { execute, validate } from '../skills/text-summarizer/index.js';

describe('text-summarizer', () => {
  describe('validate', () => {
    it('should accept valid input', () => {
      const result = validate({
        text: 'This is a long text that needs to be summarized. ' + 'More content. '.repeat(20)
      });
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject missing text', () => {
      const result = validate({});
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Text parameter is required');
    });
    
    it('should reject text that is too short', () => {
      const result = validate({ text: 'Too short' });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Text is too short to summarize');
    });
  });
  
  it('should generate summary', async () => {
    const input = {
      text: 'Artificial intelligence is revolutionizing many industries. ' +
            'Machine learning models can now process vast amounts of data. ' +
            'This leads to better decision making and automation. ' +
            'Companies are investing heavily in AI research. ' +
            'The future looks promising for AI applications.',
      length: 'short',
      style: 'generative'
    };
    
    const result = await execute(input);
    
    expect(result.success).toBe(true);
    expect(result.summary).toBeDefined();
    expect(result.summaryLength).toBeLessThan(result.originalLength);
    expect(result.keyPoints).toBeInstanceOf(Array);
  }, 30000);
});
```

**Run tests:**

```bash
npm test -- text-summarizer
```

## 🎯 Example: Web Search Enhancer Skill

Another example - a skill that enhances web search results:

### SKILL.md

```markdown
---
name: web-search-enhancer
description: "增强网络搜索 - 获取更相关的搜索结果"
metadata:
  category: dev
  triggers: ["搜索", "查找", "search", "find"]
  author: agentwork
  version: "1.0.0"
---

# 增强网络搜索技能

## 功能
执行智能网络搜索，自动优化查询词，过滤低质量结果。

## 输入参数
- `query`: 搜索查询（必填）
- `count`: 结果数量（可选，默认 10）
- `freshness`: 时间范围（可选：pd/pw/pm/py）

## 输出格式
```json
{
  "query": "original query",
  "optimizedQuery": "optimized query",
  "results": [
    {
      "title": "Result title",
      "url": "https://...",
      "snippet": "Description...",
      "score": 0.95
    }
  ],
  "totalResults": 10
}
```
```

### Implementation

```javascript
// skills/web-search-enhancer/index.js
import { web_search } from 'agentwork/tools';

export async function execute(input, context) {
  const { query, count = 10, freshness } = input;
  
  // Optimize query
  const optimizedQuery = optimizeQuery(query);
  
  // Execute search
  const results = await web_search({
    query: optimizedQuery,
    count,
    freshness
  });
  
  // Score and filter results
  const scoredResults = results.map(result => ({
    ...result,
    score: calculateRelevanceScore(result, query)
  })).filter(r => r.score > 0.5);
  
  return {
    query,
    optimizedQuery,
    results: scoredResults.slice(0, count),
    totalResults: scoredResults.length
  };
}

function optimizeQuery(query) {
  // Add relevant modifiers
  const modifiers = [];
  
  if (!query.includes('202') && !query.includes('latest')) {
    modifiers.push('latest');
  }
  
  if (!query.includes('guide') && !query.includes('tutorial')) {
    modifiers.push('comprehensive guide');
  }
  
  return `${query} ${modifiers.join(' ')}`;
}

function calculateRelevanceScore(result, query) {
  let score = 0.5; // Base score
  
  const queryTerms = query.toLowerCase().split(' ');
  const title = result.title.toLowerCase();
  const snippet = result.snippet.toLowerCase();
  
  // Title matches
  queryTerms.forEach(term => {
    if (title.includes(term)) score += 0.15;
    if (snippet.includes(term)) score += 0.05;
  });
  
  return Math.min(score, 1.0);
}
```

## 📚 Skill Templates

### Template 1: Data Processor

```markdown
---
name: data-processor
description: "Process and transform data"
metadata:
  category: dev
  triggers: ["process", "transform", "convert"]
---

# Data Processor

## Input
- `data`: Input data
- `format`: Input format

## Output
- `processed`: Processed data
- `metadata`: Processing info
```

### Template 2: Content Generator

```markdown
---
name: content-generator
description: "Generate content from templates"
metadata:
  category: content
  triggers: ["generate", "create", "write"]
---

# Content Generator

## Input
- `template`: Template name
- `variables`: Template variables

## Output
- `content`: Generated content
- `format`: Output format
```

### Template 3: Validator

```markdown
---
name: validator
description: "Validate input against rules"
metadata:
  category: dev
  triggers: ["validate", "check", "verify"]
---

# Validator

## Input
- `data`: Data to validate
- `rules`: Validation rules

## Output
- `valid`: Boolean
- `errors`: Error list
- `warnings`: Warning list
```

## 🎯 Best Practices

1. **Clear Documentation**: Document all inputs, outputs, and behaviors
2. **Input Validation**: Validate inputs before processing
3. **Error Handling**: Provide clear error messages
4. **Testing**: Write comprehensive tests
5. **Versioning**: Use semantic versioning
6. **Single Responsibility**: One skill, one purpose

## 📚 Related Resources

- [Skills Development Guide](../docs/skills.md)
- [Workflow Definition Guide](../docs/workflows.md)
- [API Reference](../docs/api.md)
