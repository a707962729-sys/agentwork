# API 接口文档

## 基础信息

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`

## 任务相关 API

### 获取任务列表
```http
GET /tasks
```

**参数**:
- `status?` - 任务状态筛选 (pending/running/completed/failed)
- `page?` - 页码
- `limit?` - 每页数量

**响应**:
```json
{
  "tasks": [
    {
      "id": "task-001",
      "title": "任务标题",
      "description": "任务描述",
      "status": "running",
      "progress": 50,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:30:00Z",
      "workflow": { ... },
      "executorAgent": { ... },
      "steps": [ ... ],
      "decisionPoints": [ ... ],
      "retryCount": 0,
      "priority": "normal"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### 获取任务详情
```http
GET /tasks/:id
```

**响应**:
```json
{
  "task": {
    "id": "task-001",
    "title": "任务标题",
    "description": "任务描述",
    "status": "running",
    "progress": 50,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:30:00Z",
    "estimatedCompletionTime": "2024-01-01T12:00:00Z",
    "workflow": { ... },
    "executorAgent": { ... },
    "steps": [ ... ],
    "decisionPoints": [ ... ],
    "retryCount": 0,
    "priority": "normal"
  }
}
```

### 创建任务
```http
POST /tasks
```

**请求体**:
```json
{
  "title": "任务标题",
  "description": "任务描述",
  "workflowId": "workflow-001"
}
```

**响应**:
```json
{
  "task": { ... }
}
```

### 更新任务
```http
PUT /tasks/:id
```

**请求体**:
```json
{
  "title": "新标题",
  "description": "新描述",
  "status": "running"
}
```

### 删除任务
```http
DELETE /tasks/:id
```

### 任务控制
```http
POST /tasks/:id/control
```

**请求体**:
```json
{
  "action": "pause" | "resume" | "cancel"
}
```

### 批准决策点
```http
POST /decisions/:id/approve
```

**请求体**:
```json
{
  "decision": "approve" | "reject"
}
```

### 拒绝决策点
```http
POST /decisions/:id/reject
```

**请求体**:
```json
{
  "reason": "拒绝原因"
}
```

## Agent 相关 API

### 获取 Agent 列表
```http
GET /agents
```

**响应**:
```json
{
  "agents": [
    {
      "id": "agent-001",
      "name": "GeneratorAgent",
      "status": "idle",
      "currentTask": null,
      "capabilities": ["text-generation", "image-generation"]
    }
  ]
}
```

### 获取 Agent 详情
```http
GET /agents/:id
```

### 获取 Agent 状态
```http
GET /agents/:id/status
```

## 技能相关 API

### 获取技能列表
```http
GET /skills
```

### 安装技能
```http
POST /skills/install
```

**请求体**:
```json
{
  "name": "skill-name",
  "source": "local" | "npm" | "clawhub",
  "path": "/path/to/skill"
}
```

### 卸载技能
```http
DELETE /skills/:name
```

### 获取技能详情
```http
GET /skills/:name
```

## 工作流相关 API

### 获取工作流列表
```http
GET /workflows
```

**响应**:
```json
{
  "workflows": [
    {
      "id": "workflow-001",
      "name": "数据处理流程",
      "description": "自动处理数据的工作流",
      "enabled": true,
      "status": "idle",
      "steps": [ ... ]
    }
  ]
}
```

### 获取工作流详情
```http
GET /workflows/:id
```

### 创建工作流
```http
POST /workflows
```

**请求体**:
```json
{
  "name": "工作流名称",
  "description": "工作流描述",
  "steps": [ ... ]
}
```

### 更新工作流
```http
PUT /workflows/:id
```

**请求体**:
```json
{
  "name": "新名称",
  "description": "新描述",
  "enabled": true
}
```

### 删除工作流
```http
DELETE /workflows/:id
```

### 执行工作流
```http
POST /workflows/:id/execute
```

**请求体**:
```json
{
  "parameters": { ... }
}
```

### 切换工作流状态
```http
POST /workflows/:id/toggle
```

**请求体**:
```json
{
  "enabled": true
}
```

## 聊天相关 API

### 发送消息
```http
POST /chat
```

**请求体**:
```json
{
  "message": "消息内容"
}
```

### 获取聊天历史
```http
GET /chat/history
```

**参数**:
- `limit?` - 消息数量

## 系统相关 API

### 获取系统状态
```http
GET /system/status
```

**响应**:
```json
{
  "version": "1.0.0",
  "uptime": "24h",
  "memoryUsage": "512MB",
  "cpuUsage": "25%"
}
```

### 获取统计数据
```http
GET /system/stats
```

**响应**:
```json
{
  "todayTasks": 100,
  "todayTasksGrowth": 15,
  "runningTasks": 10,
  "completedTasks": 80,
  "failedTasks": 10,
  "successRate": 90,
  "activeAgents": 5,
  "totalAgents": 8,
  "systemUptime": "24h",
  "todayOutputs": 150
}
```

## WebSocket 接口

### 连接地址
```
ws://localhost:5173/ws
```

### 订阅事件

**任务更新**:
```json
{
  "type": "task:update",
  "data": { ... }
}
```

**Agent 状态更新**:
```json
{
  "type": "agent:update",
  "data": { ... }
}
```

**系统事件**:
```json
{
  "type": "system:event",
  "data": { ... }
}
```
