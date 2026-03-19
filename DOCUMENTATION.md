# AgentWork 文档索引

本文档索引提供了完整的文档导航。

## 📚 核心文档

### README.md
- **位置**: `/README.md`
- **语言**: 中文
- **内容**: 项目概述、安装、快速开始、示例
- **链接**: [README.md](./README.md)

### README.zh.md
- **位置**: `/README.zh.md`
- **语言**: 中文（详细版）
- **内容**: 完整的中文使用指南
- **链接**: [README.zh.md](./README.zh.md)

## 📖 详细文档 (docs/)

### 1. getting-started.md - 快速开始
- **位置**: `/docs/getting-started.md`
- **适合人群**: 新手用户
- **内容**:
  - 安装步骤
  - 快速开始示例
  - 基本命令
  - 常见问题解决
- **链接**: [getting-started.md](./docs/getting-started.md)

### 2. skills.md - 技能开发指南
- **位置**: `/docs/skills.md`
- **适合人群**: 技能开发者
- **内容**:
  - SKILL.md 格式说明
  - 创建自定义技能
  - 技能安装和管理
  - 技能测试方法
  - 最佳实践
- **链接**: [skills.md](./docs/skills.md)

### 3. workflows.md - 工作流定义指南
- **位置**: `/docs/workflows.md`
- **适合人群**: 工作流设计者
- **内容**:
  - YAML 工作流格式
  - 输入/输出定义
  - 步骤配置
  - 检查点设置
  - 执行流程控制
  - 完整示例
- **链接**: [workflows.md](./docs/workflows.md)

### 4. agents.md - Agent 配置指南
- **位置**: `/docs/agents.md`
- **适合人群**: 系统配置者
- **内容**:
  - Agent YAML 格式
  - 模型选择
  - 技能和工具配置
  - Persona 设置
  - Agent 类型示例
- **链接**: [agents.md](./docs/agents.md)

### 5. api.md - API 参考
- **位置**: `/docs/api.md`
- **适合人群**: 开发者
- **内容**:
  - 完整 API 文档
  - 类型定义
  - 使用示例
  - 错误处理
- **链接**: [api.md](./docs/api.md)

## 💡 示例文档 (examples/)

### 1. basic-task.md - 基础任务示例
- **位置**: `/examples/basic-task.md`
- **难度**: ⭐ 入门
- **内容**:
  - 创建任务
  - 查看任务
  - 执行任务
  - CLI 和 API 两种使用方式
- **链接**: [basic-task.md](./examples/basic-task.md)

### 2. content-workflow.md - 内容工作流示例
- **位置**: `/examples/content-workflow.md`
- **难度**: ⭐⭐ 中级
- **内容**:
  - 完整内容发布流程
  - 多步骤工作流
  - 并行执行
  - 检查点配置
  - 程序化使用
- **链接**: [content-workflow.md](./examples/content-workflow.md)

### 3. custom-skill.md - 自定义技能示例
- **位置**: `/examples/custom-skill.md`
- **难度**: ⭐⭐⭐ 高级
- **内容**:
  - 从零创建技能
  - SKILL.md 编写
  - JavaScript 实现
  - 测试方法
  - 多个完整示例
- **链接**: [custom-skill.md](./examples/custom-skill.md)

## 📂 现有工作流示例

### content-publish.yaml
- **位置**: `/workflows/content-publish.yaml`
- **用途**: 内容创作和发布
- **步骤**: 调研 → 大纲 → 写作 → 审核 → 封面 → 发布
- **链接**: [content-publish.yaml](./workflows/content-publish.yaml)

### dev-pipeline.yaml
- **位置**: `/workflows/dev-pipeline.yaml`
- **用途**: 开发流水线
- **步骤**: 代码审查 → 测试 → 构建 → 部署
- **链接**: [dev-pipeline.yaml](./workflows/dev-pipeline.yaml)

## 🤖 现有 Agent 配置

### coordinator.yaml
- **位置**: `/agents/coordinator.yaml`
- **角色**: 任务协调者
- **职责**: 任务拆解、分配、协调
- **链接**: [coordinator.yaml](./agents/coordinator.yaml)

### content-writer.yaml
- **位置**: `/agents/content-writer.yaml`
- **角色**: 内容创作者
- **职责**: 文章写作、大纲设计
- **链接**: [content-writer.yaml](./agents/content-writer.yaml)

### developer.yaml
- **位置**: `/agents/developer.yaml`
- **角色**: 开发者
- **职责**: 代码开发、审查
- **链接**: [developer.yaml](./agents/developer.yaml)

## 🔧 现有技能

### task-decompose
- **位置**: `/skills/task-decompose/`
- **功能**: 任务自动拆解
- **SKILL.md**: [task-decompose/SKILL.md](./skills/task-decompose/SKILL.md)

### article-writing
- **位置**: `/skills/article-writing/`
- **功能**: 文章写作
- **SKILL.md**: [article-writing/SKILL.md](./skills/article-writing/SKILL.md)

### web-search
- **位置**: `/skills/web-search/`
- **功能**: 网络搜索
- **SKILL.md**: [web-search/SKILL.md](./skills/web-search/SKILL.md)

## 🎯 学习路径

### 新手入门
1. 阅读 [README.md](./README.md) 了解项目
2. 按照 [getting-started.md](./docs/getting-started.md) 安装和配置
3. 运行 [basic-task.md](./examples/basic-task.md) 示例
4. 尝试运行现有工作流

### 技能开发者
1. 阅读 [skills.md](./docs/skills.md) 了解技能格式
2. 参考 [custom-skill.md](./examples/custom-skill.md) 创建技能
3. 查看现有技能的 SKILL.md 文件
4. 测试和发布技能

### 工作流设计者
1. 阅读 [workflows.md](./docs/workflows.md) 学习 YAML 格式
2. 研究 [content-workflow.md](./examples/content-workflow.md) 示例
3. 查看现有工作流文件
4. 设计和测试自己的工作流

### 系统配置者
1. 阅读 [agents.md](./docs/agents.md) 配置 Agent
2. 查看现有 Agent 配置文件
3. 根据需求调整模型和工具权限
4. 测试配置效果

### API 开发者
1. 阅读 [api.md](./docs/api.md) 了解 API
2. 查看类型定义
3. 编写集成代码
4. 测试 API 调用

## 📊 文档统计

| 类别 | 文件数 | 总行数 |
|------|--------|--------|
| 核心文档 | 2 | ~200 |
| 详细文档 | 5 | ~1,761 |
| 示例文档 | 3 | ~1,291 |
| **总计** | **10** | **~3,252** |

## 🔗 快速链接

### 文档
- [快速开始](./docs/getting-started.md)
- [技能开发](./docs/skills.md)
- [工作流定义](./docs/workflows.md)
- [Agent 配置](./docs/agents.md)
- [API 参考](./docs/api.md)

### 示例
- [基础任务](./examples/basic-task.md)
- [内容工作流](./examples/content-workflow.md)
- [自定义技能](./examples/custom-skill.md)

### 配置
- [工作流](./workflows/)
- [Agent](./agents/)
- [技能](./skills/)

## 🆘 获取帮助

1. **查看文档**: 大多数问题在文档中有答案
2. **查看示例**: 示例代码展示了最佳实践
3. **检查配置**: 确保 YAML 格式正确
4. **查看日志**: 错误信息帮助定位问题

---

**最后更新**: 2026-03-19
**版本**: 1.0.0
