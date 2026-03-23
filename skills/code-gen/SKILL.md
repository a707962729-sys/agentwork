---
name: code-gen
description: 代码生成技能。根据需求生成代码，支持多种语言，代码规范检查。触发词：代码生成、生成代码、写代码、code generation、generate code、coding、帮我写代码。支持 TypeScript/Python/Go/Rust/Java 等，包含规范检查、测试生成、文档注释。
dependency:
  llm: "支持代码生成的模型"
---

# 代码生成技能

根据需求描述生成高质量代码，支持多语言和规范检查。

## 工作流程

1. **理解需求** - 分析功能描述，识别关键点
2. **选择语言** - 根据上下文或用户指定
3. **生成代码** - 按最佳实践编写
4. **规范检查** - 运行 lint、安全检测
5. **输出结果** - 代码 + 文档 + 测试

## 支持的语言

| 语言 | 框架支持 |
|------|----------|
| TypeScript | Express, NestJS, React, Vue |
| Python | Flask, Django, FastAPI |
| Go | Gin, Echo |
| Rust | Actix, Rocket, Tokio |
| Java | Spring Boot |
| SQL | PostgreSQL, MySQL |

## 输入参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `prompt` | 是 | 功能需求描述 |
| `language` | 否 | 目标语言，默认自动检测 |
| `output` | 否 | 输出文件路径 |
| `docs` | 否 | 是否生成文档注释 |
| `tests` | 否 | 是否生成测试用例 |

## 详细参考

- 代码模板库：`references/templates.md`
- 规范检查规则：`references/lint-rules.md`

## 输出模板

输出格式详见：`templates/code-output.md`