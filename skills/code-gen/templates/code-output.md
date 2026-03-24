# 代码输出模板

## 标准输出格式

```json
{
  "files": [
    {
      "path": "src/main.ts",
      "language": "typescript",
      "content": "// 代码内容...",
      "lines": 120,
      "imports": ["express", "dotenv"],
      "exports": ["app", "startServer"]
    }
  ],
  "docs": {
    "description": "模块描述",
    "usage": "使用说明",
    "dependencies": ["express@^4.18.0"]
  },
  "tests": [
    {
      "file": "src/main.test.ts",
      "cases": ["should work correctly", "should handle errors"]
    }
  ],
  "lintResult": {
    "passed": true,
    "warnings": 2,
    "errors": 0
  }
}
```

---

## Markdown 输出格式

````markdown
# 文件：src/main.ts

## 功能
- 功能点1
- 功能点2

## 使用方法
```bash
npm install
npm start
```

## API 文档
### GET /api/items
获取列表

### POST /api/items
创建项目

## 依赖
- express@^4.18.0
- dotenv@^16.0.0
````

---

## 代码检查报告格式

```markdown
# 代码检查报告

## 📊 总体评分：85/100

## ✅ 通过项 (12)
- 命名规范
- 类型定义完整
- 错误处理

## ⚠️ 警告项 (3)
1. 第 23 行：建议使用可选链 `?.`
2. 第 45 行：函数复杂度过高
3. 第 67 行：缺少 JSDoc 注释

## ❌ 问题项 (1)
1. 第 89 行：潜在的空指针引用

## 📝 建议
- 拆分复杂函数
- 添加单元测试
- 完善 JSDoc 注释
```