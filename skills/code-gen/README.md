# Code Gen 技能

代码生成技能，根据需求生成代码，支持多种语言，包含代码规范检查。

## 快速开始

```bash
# 生成代码
code-gen --prompt "创建 HTTP 服务器，支持 GET/POST" --language typescript

# 生成带测试的代码
code-gen --prompt "快速排序算法" --language python --tests

# 检查代码规范
code-gen --check src/main.go
```

## 支持语言

| 语言 | 框架支持 |
|------|----------|
| TypeScript | Express, NestJS, React, Vue |
| JavaScript | Node.js, React, Vue |
| Python | Flask, Django, FastAPI |
| Go | Gin, Echo |
| Rust | Actix, Rocket |
| Java | Spring Boot |
| SQL | PostgreSQL, MySQL |

## 功能特性

- 🤖 **AI 代码生成** - 自然语言描述转代码
- 📝 **多语言支持** - 8+ 编程语言
- ✅ **规范检查** - ESLint/PEP8/gofmt 等
- 🔒 **安全检测** - 漏洞和最佳实践
- 📦 **代码模板** - 项目脚手架和常用模板
- 🧪 **测试生成** - 单元测试自动生成

## 使用场景

1. **快速原型** - 快速生成 MVP 代码
2. **重复代码** - 生成 CRUD、工具函数
3. **学习参考** - 查看最佳实践实现
4. **代码审查** - 规范检查和建议
5. **项目启动** - 生成脚手架和模板

## 输出示例

```
✅ 代码生成完成！
文件：auth.ts
语言：TypeScript
行数：156
功能：用户登录、JWT 生成、密码加密
规范检查：✅ 通过
```

## 代码模板

```bash
code-gen --template express-api --output api/
code-gen --template react-component --output Component.tsx
code-gen --template prisma-schema --output schema.prisma
```

详见 SKILL.md 获取完整文档。
