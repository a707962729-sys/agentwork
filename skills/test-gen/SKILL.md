---
name: test-gen
description: 测试生成技能。单元测试、集成测试、E2E测试生成，覆盖率报告。触发词：测试生成、生成测试、单元测试、集成测试、test generation、unit test、coverage、写测试。支持 Jest/Vitest/Pytest/Go testing/JUnit，包含边界测试、Mock数据。
dependency:
  framework: "测试框架 (Jest/Vitest/Pytest/Go testing)"
---

# 测试生成技能

自动化测试代码生成，支持多种测试框架和覆盖率报告。

## 工作流程

1. **分析代码** - 理解函数/模块逻辑
2. **识别场景** - 正常、边界、异常
3. **生成测试** - 按 AAA 模式编写
4. **Mock 依赖** - 隔离外部依赖
5. **运行验证** - 执行测试并生成报告

## 支持的框架

| 语言 | 框架 |
|------|------|
| TypeScript/JavaScript | Jest, Vitest, Mocha |
| Python | Pytest, Unittest |
| Go | testing (内置) |
| Java | JUnit, TestNG |
| Rust | Cargo test (内置) |

## 输入参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `file` | 是 | 目标源文件 |
| `type` | 否 | 测试类型：unit/integration/e2e |
| `framework` | 否 | 测试框架，默认自动检测 |
| `coverage` | 否 | 是否生成覆盖率报告 |

## 详细参考

- 测试模板：`references/test-templates.md`
- 最佳实践：`references/best-practices.md`

## 输出模板

输出格式详见：`templates/test-output.md`