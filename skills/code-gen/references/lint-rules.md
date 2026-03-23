# 代码规范检查规则

## TypeScript/JavaScript

### ESLint 规则
```json
{
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"]
  }
}
```

### 常见问题
| 问题 | 规则 | 建议 |
|------|------|------|
| 使用 var | no-var | 使用 const/let |
| == 比较 | eqeqeq | 使用 === |
| 未使用变量 | no-unused-vars | 删除或使用 |
| 缺少分号 | semi | 添加分号或配置 ASI |

---

## Python

### PEP 8 规范
- 缩进：4 空格
- 行长：最大 79 字符
- 导入顺序：标准库 → 第三方 → 本地
- 命名：snake_case（函数/变量）、PascalCase（类）

### Type Hints
```python
def greet(name: str, age: int = 0) -> str:
    return f"Hello, {name}! You are {age} years old."
```

---

## Go

### gofmt + golint
- 格式化：gofmt 自动处理
- 命名：驼峰式，导出首字母大写
- 错误处理：显式处理，不忽略

```go
// 正确
if err != nil {
    return fmt.Errorf("failed to ...: %w", err)
}

// 错误
if err != nil {} // 空处理
```

---

## Rust

### rustfmt + clippy
- 格式化：rustfmt
- lint：clippy

```rust
// 正确
fn calculate(x: i32) -> Result<i32, String> {
    if x < 0 {
        return Err("x must be positive".to_string());
    }
    Ok(x * 2)
}
```

---

## 安全检测规则

| 风险 | 检测规则 |
|------|----------|
| SQL 注入 | 检查字符串拼接 SQL |
| XSS | 检查 innerHTML/v-html 使用 |
| 敏感信息 | 检查硬编码密钥/密码 |
| 路径遍历 | 检查未验证的路径输入 |
| 命令注入 | 检查 exec/system 调用 |