# 测试输出模板

## 标准输出格式

```json
{
  "testFiles": [
    {
      "path": "tests/user.service.test.ts",
      "testCases": 12,
      "passed": 12,
      "failed": 0,
      "duration": "1.5s"
    }
  ],
  "coverage": {
    "lines": 85.5,
    "branches": 72.3,
    "functions": 90.0,
    "statements": 86.2
  },
  "summary": {
    "total": 12,
    "passed": 12,
    "failed": 0,
    "skipped": 0
  }
}
```

---

## Markdown 输出格式

```markdown
# 测试生成报告

## 📊 测试结果

| 指标 | 值 |
|------|-----|
| 总测试数 | 12 |
| 通过 | ✅ 12 |
| 失败 | ❌ 0 |
| 跳过 | ⏭️ 0 |
| 耗时 | 1.5s |

## 📈 覆盖率

| 类型 | 覆盖率 | 状态 |
|------|--------|------|
| 行覆盖率 | 85.5% | 🟢 |
| 分支覆盖率 | 72.3% | 🟡 |
| 函数覆盖率 | 90.0% | 🟢 |
| 语句覆盖率 | 86.2% | 🟢 |

## 📁 生成的文件

- `tests/user.service.test.ts` (12 tests)
- `tests/auth.service.test.ts` (8 tests)
- `tests/utils.test.ts` (5 tests)

## 🚀 运行命令

```bash
npm test
npm run test:coverage
```
```

---

## 覆盖率报告格式

```markdown
## 未覆盖代码

| 文件 | 行号 | 类型 |
|------|------|------|
| src/auth.ts | 45-52 | 错误处理分支 |
| src/api.ts | 120-135 | 边界条件 |

## 建议

1. 补充 `src/auth.ts:45-52` 的错误场景测试
2. 添加 `src/api.ts:120-135` 的边界值测试
```