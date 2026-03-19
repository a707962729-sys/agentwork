---
name: code-gen
description: "代码生成技能 - 根据需求生成代码，支持多种语言，代码规范检查"
metadata:
  category: dev
  triggers: ["代码生成", "生成代码", "写代码", "code generation", "generate code", "coding"]
  author: agentwork
  version: "1.0.0"
---

# 代码生成技能 (code-gen)

## 功能

本技能提供 AI 驱动的代码生成能力，支持多种编程语言和场景：

1. **根据需求生成代码**
   - 功能描述转代码
   - 伪代码转实现
   - 注释驱动开发
   - 测试驱动生成

2. **多语言支持**
   - TypeScript/JavaScript
   - Python
   - Go
   - Rust
   - Java
   - C/C++
   - SQL
   - Shell 脚本

3. **代码规范检查**
   - 语言规范符合性
   - 代码风格检查
   - 最佳实践建议
   - 安全漏洞检测

4. **代码模板**
   - 项目脚手架
   - 常用函数模板
   - API 接口模板
   - 数据库操作模板

## 使用方法

### 基本用法

```bash
# 根据描述生成代码
code-gen --prompt "创建一个 HTTP 服务器，支持 GET/POST 请求"

# 指定语言
code-gen --prompt "快速排序算法" --language python

# 生成完整文件
code-gen --prompt "用户认证模块" --output auth.ts

# 检查代码规范
code-gen --check existing-code.ts
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--prompt` | 代码需求描述 | - |
| `--language` | 目标语言 | auto-detect |
| `--output` | 输出文件路径 | stdout |
| `--check` | 检查现有代码 | - |
| `--template` | 使用模板 | - |
| `--style` | 代码风格 | standard |
| `--docs` | 生成文档注释 | true |
| `--tests` | 生成测试用例 | false |

### 支持的语言

| 语言 | 框架/库支持 |
|------|-------------|
| TypeScript | Express, NestJS, React, Vue |
| JavaScript | Node.js, React, Vue, Angular |
| Python | Flask, Django, FastAPI, Pandas |
| Go | Gin, Echo, standard library |
| Rust | Actix, Rocket, Tokio |
| Java | Spring Boot, Hibernate |
| C++ | STL, Boost |
| SQL | PostgreSQL, MySQL, SQLite |

## 输入输出

### 输入

- **需求描述**: 自然语言描述功能需求
- **语言选择**: 指定目标编程语言
- **上下文**: 可选的项目背景、现有代码
- **约束条件**: 性能、安全、兼容性要求

### 输出

**代码生成：**

```
✅ 代码生成完成！

文件：auth.ts
语言：TypeScript
行数：156
大小：4.2 KB

功能:
- 用户登录验证
- JWT Token 生成
- 密码加密存储
- 会话管理

规范检查：✅ 通过
```

**代码检查结果：**

```
📋 代码检查报告

文件：existing-code.ts

✅ 通过项 (12)
- 命名规范
- 类型定义
- 错误处理

⚠️ 警告项 (3)
1. 第 23 行：建议使用可选链操作符
2. 第 45 行：函数复杂度过高 (建议<20)
3. 第 67 行：缺少 JSDoc 注释

❌ 问题项 (1)
1. 第 89 行：潜在的空指针引用

评分：85/100
```

## 示例

### 示例 1：生成 HTTP 服务器

```bash
code-gen --prompt "创建一个 Express 服务器，包含用户 CRUD API" --language typescript --output user-api.ts
```

### 示例 2：生成算法实现

```bash
code-gen --prompt "实现二分查找算法，包含递归和迭代版本" --language python --tests
```

### 示例 3：生成数据库查询

```bash
code-gen --prompt "查询用户订单，按时间排序，支持分页" --language sql --output orders.sql
```

### 示例 4：代码规范检查

```bash
code-gen --check src/main.go --style golang
```

### 示例 5：生成项目脚手架

```bash
code-gen --template nestjs-api --output my-project/
```

### 示例 6：生成工具函数

```bash
code-gen --prompt "日期格式化函数，支持多种格式" --language javascript --docs
```

## 代码模板

### 可用模板

```bash
# Web API 模板
code-gen --template express-api --output api/
code-gen --template nestjs-api --output api/
code-gen --template flask-api --output api/

# 前端模板
code-gen --template react-component --output Component.tsx
code-gen --template vue-component --output Component.vue

# 工具模板
code-gen --template cli-tool --output cli.ts
code-gen --template cron-job --output job.ts

# 数据库模板
code-gen --template prisma-schema --output schema.prisma
code-gen --template typeorm-entity --output Entity.ts
```

## 代码规范

### 检查规则

**TypeScript/JavaScript:**
- ESLint 标准规则
- Prettier 格式化
- 类型安全检测
- 空值检查

**Python:**
- PEP 8 规范
- Type hints 检查
- 导入顺序规范
- 文档字符串要求

**Go:**
- gofmt 格式化
- golint 规则
- 错误处理规范
- 命名约定

**Rust:**
- rustfmt 格式化
- clippy 建议
- 所有权检查
- 生命周期标注

### 安全检测

- SQL 注入防护
- XSS 攻击防护
- CSRF Token 验证
- 输入验证
- 敏感信息处理

## 配置

创建 `~/.code-gen/config.json` 自定义默认设置：

```json
{
  "defaultLanguage": "typescript",
  "defaultStyle": "standard",
  "outputDir": "~/code-gen-output",
  "autoFormat": true,
  "includeDocs": true,
  "includeTests": false,
  "preferredFrameworks": {
    "typescript": "express",
    "python": "fastapi",
    "go": "gin"
  }
}
```

## 最佳实践

1. **描述清晰**: 需求描述越详细，生成代码越准确
2. **分步生成**: 复杂功能分多次生成，逐步完善
3. **及时检查**: 生成后立即运行规范检查
4. **人工 review**: AI 生成代码必须人工审查
5. **测试覆盖**: 重要功能要求生成测试用例

## 注意事项

1. 生成的代码需要人工审查和测试
2. 敏感业务逻辑不建议完全依赖生成
3. 注意代码版权和开源协议
4. 定期更新代码规范规则库
