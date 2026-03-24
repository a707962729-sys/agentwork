# 代码模板库

## Web API 模板

### Express (TypeScript)
```typescript
import express from 'express';

const app = express();
app.use(express.json());

app.get('/api/items', async (req, res) => {
  // TODO: 实现获取逻辑
  res.json({ items: [] });
});

app.post('/api/items', async (req, res) => {
  // TODO: 实现创建逻辑
  res.status(201).json({ id: 1, ...req.body });
});

export default app;
```

### FastAPI (Python)
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    value: int

@app.get("/api/items")
async def get_items():
    # TODO: 实现获取逻辑
    return {"items": []}

@app.post("/api/items")
async def create_item(item: Item):
    # TODO: 实现创建逻辑
    return {"id": 1, **item.model_dump()}
```

---

## 常用函数模板

### 日期处理
```typescript
function formatDate(date: Date, format: string): string {
  const map: Record<string, string> = {
    'YYYY': date.getFullYear().toString(),
    'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
    'DD': date.getDate().toString().padStart(2, '0'),
  };
  return format.replace(/YYYY|MM|DD/g, matched => map[matched]);
}
```

### 数据验证
```typescript
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePhone(phone: string): boolean {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
}
```

### 防抖节流
```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= delay) {
      fn(...args);
      last = now;
    }
  };
}
```

---

## 数据库操作模板

### Prisma (TypeScript)
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 创建
async function create(data: CreateInput) {
  return prisma.model.create({ data });
}

// 查询
async function findMany(filter: Filter) {
  return prisma.model.findMany({ where: filter });
}

// 更新
async function update(id: number, data: UpdateInput) {
  return prisma.model.update({ where: { id }, data });
}

// 删除
async function remove(id: number) {
  return prisma.model.delete({ where: { id } });
}
```

---

## 错误处理模板

```typescript
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
  }
}

// 使用
if (!user) {
  throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
}
```