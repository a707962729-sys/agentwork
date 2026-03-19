# AgentWork Docker 部署指南

本文档介绍如何使用 Docker 部署 AgentWork 自动化平台。

## 📋 目录

- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [配置说明](#配置说明)
- [运维管理](#运维管理)
- [故障排查](#故障排查)

---

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (仅用于构建)
- 2GB+ 可用内存
- 10GB+ 可用磁盘空间

### 检查 Docker 版本

```bash
docker --version
docker compose version
```

---

## 快速开始

### 1. 构建项目

```bash
cd ~/Desktop/agentwork
npm install
npm run build
```

### 2. 启动开发环境

```bash
cd docker
docker compose up -d
```

### 3. 查看日志

```bash
docker compose logs -f agentwork
```

### 4. 停止服务

```bash
docker compose down
```

---

## 开发环境部署

### 启动服务

```bash
cd docker
docker compose up -d
```

### 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| agentwork | - | 主应用服务 |
| redis | 6379 | Redis 缓存服务 |

### 查看运行状态

```bash
# 查看所有容器状态
docker compose ps

# 查看资源使用
docker stats
```

### 进入容器

```bash
# 进入 agentwork 容器
docker compose exec agentwork sh

# 进入 redis 容器
docker compose exec redis redis-cli
```

### 重启服务

```bash
# 重启单个服务
docker compose restart agentwork

# 重启所有服务
docker compose restart
```

---

## 生产环境部署

### 1. 准备配置文件

```bash
cd docker

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入实际配置
nano .env
```

### 2. 准备生产配置

```bash
# 复制生产配置文件模板
cp config.yaml config.prod.yaml

# 编辑生产配置
nano config.prod.yaml
```

### 3. 启动生产环境

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 4. 验证部署

```bash
# 检查服务状态
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f agentwork

# 检查健康状态
docker inspect --format='{{.State.Health.Status}}' agentwork-prod
```

---

## 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| NODE_ENV | 运行环境 | development |
| LOG_LEVEL | 日志级别 | info |
| CONFIG_PATH | 配置文件路径 | /app/config.yaml |
| API_KEY | API 密钥 | - |
| DATABASE_URL | 数据库连接 | sqlite:/app/data/agentwork.db |
| REDIS_URL | Redis 连接 | redis://redis:6379 |
| TZ | 时区 | Asia/Shanghai |

### 数据持久化

以下数据通过 Docker volumes 持久化：

- `agentwork-data`: 应用数据
- `agentwork-logs`: 应用日志
- `redis-data`: Redis 数据

### 日志配置

生产环境日志配置：
- 单文件最大：100MB
- 最大文件数：10
- 总日志容量：1GB

---

## 运维管理

### 查看日志

```bash
# 实时查看日志
docker compose logs -f agentwork

# 查看最近 100 行
docker compose logs --tail=100 agentwork

# 查看特定时间范围
docker compose logs --since="2024-01-01" agentwork
```

### 备份数据

```bash
# 备份数据卷
docker run --rm \
  -v agentwork_agentwork-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/agentwork-data-backup.tar.gz -C /data .

# 备份 Redis 数据
docker run --rm \
  -v agentwork_redis-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/redis-data-backup.tar.gz -C /data .
```

### 恢复数据

```bash
# 恢复数据卷
docker run --rm \
  -v agentwork_agentwork-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/agentwork-data-backup.tar.gz -C /data
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建
npm run build

# 重建容器
docker compose -f docker-compose.prod.yml up -d --build

# 清理旧镜像
docker image prune -f
```

### 资源监控

```bash
# 查看容器资源使用
docker stats agentwork-prod redis-prod

# 查看容器详细信息
docker inspect agentwork-prod
```

---

## 故障排查

### 容器无法启动

```bash
# 查看容器日志
docker compose logs agentwork

# 检查容器状态
docker compose ps -a

# 查看退出码
docker inspect agentwork-prod | grep ExitCode
```

### Redis 连接失败

```bash
# 检查 Redis 服务
docker compose exec redis redis-cli ping

# 查看 Redis 日志
docker compose logs redis
```

### 磁盘空间不足

```bash
# 清理未使用的资源
docker system prune -a

# 清理日志文件
docker compose logs --tail=0 agentwork
```

### 健康检查失败

```bash
# 查看健康检查状态
docker inspect --format='{{json .State.Health}}' agentwork-prod | jq

# 手动执行健康检查
docker compose exec agentwork node -e "console.log('healthy')"
```

### 常见问题

#### Q: 容器启动后立即退出
A: 检查日志确认错误原因，通常是配置文件错误或依赖服务未就绪。

#### Q: Redis 无法连接
A: 确保 Redis 服务先启动完成，检查网络配置。

#### Q: 数据丢失
A: 确认 volumes 配置正确，不要使用 `docker compose down -v` 删除数据卷。

---

## 安全建议

1. **生产环境不要暴露 Redis 端口** - 仅在内部网络访问
2. **启用 Redis 认证** - 在 redis.conf 中设置密码
3. **使用非 root 用户** - Dockerfile 已配置
4. **定期更新镜像** - 保持基础镜像最新
5. **限制资源使用** - 配置 CPU 和内存限制
6. **启用日志轮转** - 防止日志占满磁盘

---

## 性能优化

### 构建优化

```dockerfile
# 使用多阶段构建减少镜像大小
FROM node:20-alpine AS builder
# ... 构建步骤 ...

FROM node:20-alpine
# ... 复制构建结果 ...
```

### 运行时优化

- 调整 Node.js 内存限制：`NODE_OPTIONS="--max-old-space-size=1024"`
- 使用 PM2 进行进程管理
- 启用 Redis 持久化优化

---

## 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Node.js Docker 最佳实践](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Redis Docker 配置](https://hub.docker.com/_/redis)

---

**最后更新**: 2024-03-19
**版本**: 1.0.0
