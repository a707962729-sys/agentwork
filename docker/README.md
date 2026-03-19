# AgentWork Docker 配置

本目录包含 AgentWork 的完整 Docker 部署配置。

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `Dockerfile` | Docker 镜像构建文件 |
| `docker-compose.yml` | 开发环境配置 |
| `docker-compose.prod.yml` | 生产环境配置 |
| `.dockerignore` | Docker 构建排除文件 |
| `entrypoint.sh` | 容器启动脚本 |
| `redis.conf` | Redis 生产配置 |
| `.env.example` | 环境变量模板 |

## 🚀 快速开始

### 开发环境

```bash
# 1. 构建项目
cd ..
npm install
npm run build

# 2. 启动 Docker
cd docker
docker compose up -d

# 3. 查看日志
docker compose logs -f agentwork
```

### 生产环境

```bash
# 1. 准备配置
cp .env.example .env
# 编辑 .env 填入实际配置

# 2. 启动生产环境
docker compose -f docker-compose.prod.yml up -d

# 3. 验证部署
docker compose -f docker-compose.prod.yml ps
```

## 📖 详细文档

完整部署指南请查看：[docs/deployment.md](../docs/deployment.md)

## 🔧 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 进入容器
docker compose exec agentwork sh

# 重建镜像
docker compose up -d --build
```

## ⚠️ 注意事项

1. 首次运行前确保已执行 `npm run build`
2. 生产环境请复制 `.env.example` 为 `.env` 并配置实际值
3. 数据通过 Docker volumes 持久化，删除容器不会丢失数据
4. 使用 `docker compose down -v` 会删除数据卷，请谨慎使用
