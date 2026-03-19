---
name: test-gen
description: "测试生成技能 - 单元测试、集成测试生成，覆盖率报告"
metadata:
  category: dev
  triggers: ["测试生成", "生成测试", "单元测试", "集成测试", "test generation", "unit test", "coverage"]
  author: agentwork
  version: "1.0.0"
---

# 测试生成技能 (test-gen)

## 功能

本技能提供自动化的测试代码生成能力：

1. **单元测试生成**
   - 函数/方法级别测试
   - 边界条件测试
   - 异常场景测试
   - Mock 数据生成

2. **集成测试生成**
   - API 接口测试
   - 数据库操作测试
   - 第三方服务集成测试
   - E2E 流程测试

3. **覆盖率报告**
   - 代码覆盖率分析
   - 未覆盖代码标识
   - 覆盖率提升建议
   - HTML 可视化报告

4. **测试框架支持**
   - Jest/Vitest (JavaScript/TypeScript)
   - Pytest/Unittest (Python)
   - Go testing (Go)
   - JUnit (Java)
   - Cargo test (Rust)

## 使用方法

### 基本用法

```bash
# 为文件生成单元测试
test-gen --file src/utils.ts

# 生成集成测试
test-gen --file src/api/user.ts --type integration

# 生成覆盖率报告
test-gen --coverage --dir src/

# 为整个项目生成测试
test-gen --project --output tests/
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--file` | 目标源文件 | - |
| `--type` | 测试类型 (unit/integration/e2e) | unit |
| `--output` | 输出目录 | ./tests |
| `--coverage` | 生成覆盖率报告 | false |
| `--project` | 整个项目模式 | false |
| `--framework` | 测试框架 | auto-detect |
| `--mock` | 生成 Mock 数据 | true |
| `--edge-cases` | 包含边界测试 | true |

### 支持的测试框架

| 语言 | 框架 |
|------|------|
| TypeScript/JavaScript | Jest, Vitest, Mocha |
| Python | Pytest, Unittest |
| Go | testing (builtin) |
| Java | JUnit, TestNG |
| Rust | Cargo test (builtin) |

## 输入输出

### 输入

- **源文件**: 需要测试的代码文件
- **测试类型**: 单元/集成/E2E
- **测试框架**: 指定或自动检测
- **覆盖范围**: 单文件/整个项目

### 输出

**测试文件生成：**

```
✅ 测试生成完成！

源文件：src/utils/auth.ts
测试文件：tests/utils/auth.test.ts
测试框架：Jest
生成测试数：12

测试覆盖:
- ✅ 正常场景 (6)
- ✅ 边界条件 (4)
- ✅ 异常场景 (2)

运行测试：
$ npm test -- auth.test.ts
```

**覆盖率报告：**

```
📊 覆盖率报告

文件覆盖率:
┌─────────────────┬───────┬───────┬───────┐
│ 文件            │ 行    │ 分支  │ 函数  │
├─────────────────┼───────┼───────┼───────┤
│ src/utils.ts    │ 95.2% │ 88.5% │ 100%  │
│ src/auth.ts     │ 87.3% │ 75.0% │ 92.3% │
│ src/api.ts      │ 78.9% │ 68.2% │ 85.7% │
├─────────────────┼───────┼───────┼───────┤
│ 总计            │ 87.1% │ 77.2% │ 92.7% │
└─────────────────┴───────┴───────┴───────┘

未覆盖代码:
1. src/auth.ts:45-52 (错误处理分支)
2. src/api.ts:120-135 (边界条件)

建议：
- 添加错误场景测试
- 补充边界值测试

HTML 报告：./coverage/index.html
```

## 示例

### 示例 1：生成单元测试

```bash
test-gen --file src/utils/format.ts --framework jest
```

### 示例 2：生成集成测试

```bash
test-gen --file src/api/user.ts --type integration --mock
```

### 示例 3：生成 E2E 测试

```bash
test-gen --file src/flows/checkout.ts --type e2e --output tests/e2e/
```

### 示例 4：生成覆盖率报告

```bash
test-gen --coverage --dir src/ --format html
```

### 示例 5：整个项目测试生成

```bash
test-gen --project --output tests/ --skip node_modules
```

### 示例 6：Python 项目测试

```bash
test-gen --file app/services/user.py --framework pytest
```

## 测试模板

### 单元测试模板

```typescript
// 生成的 Jest 测试示例
describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService(mockRepo);
  });

  describe('createUser', () => {
    it('应该成功创建用户', async () => {
      const user = await service.createUser({
        name: 'Test',
        email: 'test@example.com'
      });
      expect(user.id).toBeDefined();
      expect(user.name).toBe('Test');
    });

    it('邮箱重复时应该抛出错误', async () => {
      await expect(
        service.createUser({ email: 'existing@example.com' })
      ).rejects.toThrow('Email already exists');
    });

    it('应该处理边界情况：空名称', async () => {
      await expect(
        service.createUser({ name: '', email: 'test@example.com' })
      ).rejects.toThrow('Name is required');
    });
  });
});
```

### 集成测试模板

```typescript
// API 集成测试示例
describe('User API Integration', () => {
  let app: Express;
  let db: TestDatabase;

  beforeAll(async () => {
    db = await setupTestDatabase();
    app = createApp(db);
  });

  afterAll(async () => {
    await db.cleanup();
  });

  describe('POST /api/users', () => {
    it('应该创建用户并返回 201', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test', email: 'test@example.com' });
      
      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
    });
  });
});
```

## 覆盖率配置

### Jest 配置

```json
{
  "jest": {
    "coverageReporters": ["text", "html", "lcov"],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 80,
        "lines": 80
      }
    }
  }
}
```

### Pytest 配置

```ini
# pytest.ini
[pytest]
addopts = --cov=src --cov-report=html --cov-report=term-missing
```

## 配置

创建 `~/.test-gen/config.json` 自定义默认设置：

```json
{
  "defaultFramework": "jest",
  "defaultType": "unit",
  "outputDir": "./tests",
  "autoRun": false,
  "coverageThreshold": 80,
  "includeEdgeCases": true,
  "mockExternalServices": true
}
```

## 最佳实践

1. **测试命名**: 清晰描述测试场景 (`should_do_x_when_y`)
2. **AAA 模式**: Arrange-Act-Assert 结构
3. **独立测试**: 每个测试独立，不依赖其他测试
4. **Mock 外部依赖**: 数据库、API、文件系统等
5. **测试边界**: 空值、极大值、极小值、特殊字符
6. **持续集成**: 在 CI 中自动运行测试和覆盖率检查

## 注意事项

1. 生成的测试需要人工审查和调整
2. 业务逻辑复杂的测试需要补充领域知识
3. 覆盖率不是唯一指标，测试质量更重要
4. 定期维护和更新测试用例
5. 避免过度测试（测试实现细节而非行为）
