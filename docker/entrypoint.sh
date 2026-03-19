#!/bin/sh
# AgentWork Docker 入口脚本
# 负责初始化环境和启动应用

set -e

echo "🚀 Starting AgentWork..."

# 确保数据目录存在
mkdir -p /app/data
mkdir -p /app/logs

# 设置日志级别
LOG_LEVEL="${LOG_LEVEL:-info}"
export LOG_LEVEL

# 检查配置文件
if [ -f "$CONFIG_PATH" ]; then
    echo "✅ Config file found: $CONFIG_PATH"
else
    echo "⚠️  Config file not found: $CONFIG_PATH"
    echo "   Using default configuration"
fi

# 等待 Redis 就绪 (如果配置了 Redis)
if [ -n "$REDIS_URL" ]; then
    echo "⏳ Waiting for Redis..."
    # 简单等待，生产环境应该使用更健壮的检查
    sleep 2
    echo "✅ Redis connection configured"
fi

# 显示环境信息
echo "📋 Environment:"
echo "   NODE_ENV: ${NODE_ENV:-development}"
echo "   LOG_LEVEL: $LOG_LEVEL"
echo "   CONFIG_PATH: ${CONFIG_PATH:-/app/config.yaml}"

# 启动应用
echo "🎯 Starting application..."
exec node dist/cli.js "$@"
