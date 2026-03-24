# 任务规划输出模板

## 标准输出格式

```json
{
  "taskName": "任务名称",
  "goal": "任务目标描述",
  "steps": [
    {
      "id": "step-1",
      "title": "步骤标题",
      "description": "详细描述",
      "skill": "负责的技能",
      "dependsOn": [],
      "estimatedTime": "2h",
      "status": "pending",
      "input": {
        "param1": "value1"
      },
      "output": {
        "expectedResult": "预期输出"
      }
    }
  ],
  "criticalPath": ["step-1", "step-3", "step-5"],
  "parallelGroups": [
    ["step-2", "step-3"]
  ],
  "totalEstimatedTime": "8h"
}
```

---

## 可视化输出

### 甘特图格式
```
步骤          | Day1 | Day2 | Day3 | Day4 |
-------------|------|------|------|------|
需求分析      | ████ |      |      |      |
系统设计      |      | ████ |      |      |
前端开发      |      | ████ | ████ |      |
后端开发      |      | ████ | ████ |      |
测试验收      |      |      |      | ████ |
```

### 依赖关系
```
step-1 (需求分析)
  └── step-2 (系统设计)
        ├── step-3 (前端开发)
        └── step-4 (后端开发)
              └── step-5 (测试验收)
```

---

## 状态追踪

| 状态 | 说明 |
|------|------|
| `pending` | 等待执行 |
| `blocked` | 被阻塞（依赖未完成） |
| `running` | 执行中 |
| `completed` | 已完成 |
| `failed` | 执行失败 |