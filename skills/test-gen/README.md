# Test Gen 技能

测试生成技能，自动生成单元测试、集成测试，生成覆盖率报告。

## 快速开始

```bash
# 生成单元测试
test-gen --file src/utils.ts

# 生成集成测试
test-gen --file src/api/user.ts --type integration

# 生成覆盖率报告
test-gen --coverage --dir src/

# 整个项目生成测试
test-gen --project --output tests/
```

## 支持框架

| 语言 | 测试框架 |
|------|----------|
| TypeScript/JavaScript | Jest, Vitest, Mocha |
| Python | Pytest, Unittest |
| Go | testing (builtin) |
| Java | JUnit, TestNG |
| Rust | Cargo test |

## 功能特性

- 🧪 **单元测试生成** - 函数/方法级别测试
- 🔗 **集成测试生成** - API、数据库、E2E 测试
- 📊 **覆盖率报告** - 行/分支/函数覆盖率分析
- 🎭 **Mock 生成** - 自动创建 Mock 数据
- 🔍 **边界测试** - 异常场景和边界条件
- 📁 **项目模式** - 批量生成整个项目测试

## 使用场景

1. **新项目启动** - 快速建立测试套件
2. **遗留代码** - 为现有代码补充测试
3. **代码审查** - 确保测试覆盖
4. **CI/CD** - 自动化测试和覆盖率检查
5. **重构保障** - 测试保护代码质量

## 输出示例

```
✅ 测试生成完成！
源文件：src/utils/auth.ts
测试文件：tests/utils/auth.test.ts
生成测试数：12

测试覆盖:
- ✅ 正常场景 (6)
- ✅ 边界条件 (4)
- ✅ 异常场景 (2)
```

## 覆盖率报告

```
文件覆盖率：87.1%
未覆盖代码：
1. src/auth.ts:45-52 (错误处理分支)
2. src/api.ts:120-135 (边界条件)

建议：添加错误场景测试、补充边界值测试
```

## 测试模板

```typescript
describe('UserService', () => {
  it('应该成功创建用户', async () => {
    const user = await service.createUser({...});
    expect(user.id).toBeDefined();
  });

  it('邮箱重复时应该抛出错误', async () => {
    await expect(service.createUser({...}))
      .rejects.toThrow('Email already exists');
  });
});
```

详见 SKILL.md 获取完整文档。
