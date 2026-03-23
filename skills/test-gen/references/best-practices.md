# 测试最佳实践

## AAA 模式

每个测试遵循 Arrange-Act-Assert 结构：

```typescript
it('应该正确计算总价', () => {
  // Arrange - 准备测试数据
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ];

  // Act - 执行被测试的代码
  const total = calculateTotal(items);

  // Assert - 验证结果
  expect(total).toBe(250);
});
```

---

## 测试命名

### 好的命名
- `should_return_user_when_id_exists`
- `should_throw_error_when_email_invalid`
- `应该返回用户信息（当ID存在时）`

### 不好的命名
- `test1`
- `testUser`
- `it works`

---

## 边界测试清单

| 边界类型 | 测试用例 |
|----------|----------|
| 空值 | null, undefined, "" |
| 零值 | 0, [], {} |
| 极值 | MAX_VALUE, MIN_VALUE |
| 特殊字符 | emoji, 中文, 空格 |
| 边界值 | off-by-one |

---

## Mock 使用原则

1. **只 Mock 外部依赖**
   - ✅ 数据库、API、文件系统
   - ❌ 被测试的类本身

2. **Mock 行为，不是实现**
   ```typescript
   // 好：Mock 返回值
   mockRepo.findById.mockResolvedValue(user);

   // 不好：Mock 实现细节
   mockRepo.findById.mockImplementation(() => {
     // 复杂逻辑...
   });
   ```

3. **验证调用**
   ```typescript
   expect(mockRepo.save).toHaveBeenCalledWith(expectedUser);
   ```

---

## 测试覆盖策略

| 类型 | 覆盖目标 | 优先级 |
|------|----------|--------|
| 单元测试 | 核心业务逻辑 | ⭐⭐⭐⭐⭐ |
| 集成测试 | API 接口 | ⭐⭐⭐⭐ |
| E2E 测试 | 关键用户流程 | ⭐⭐⭐ |

---

## 常见错误

| 错误 | 解决方案 |
|------|----------|
| 测试间依赖 | 每个测试独立 setup/teardown |
| 过度 Mock | 减少 Mock，使用真实实现 |
| 测试实现细节 | 测试行为，不是实现 |
| 魔法数字 | 使用命名常量 |