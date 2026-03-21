#!/bin/bash
# AgentWork 一键启动脚本
# 用法: ./start.sh

cd "$(dirname "$0")"

echo "🚀 启动 AgentWork..."

# 检查是否已构建
if [ ! -d "dist" ]; then
    echo "📦 首次运行，正在构建..."
    npm run build
fi

# 启动后端 API (后台运行)
echo "🔧 启动后端 API..."
node start-api.mjs &
API_PID=$!
sleep 2

# 检查 API 是否启动成功
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 后端 API 已启动: http://localhost:3000"
else
    echo "❌ 后端 API 启动失败"
    exit 1
fi

# 启动前端
echo "🎨 启动前端..."
cd web
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 2
echo ""
echo "=========================================="
echo "  🎉 AgentWork 已启动！"
echo "=========================================="
echo ""
echo "  📊 Dashboard: http://localhost:5173"
echo "  🔧 API:       http://localhost:3000"
echo ""
echo "  按 Ctrl+C 停止服务"
echo "=========================================="
echo ""

# 等待任意子进程结束
wait $API_PID $FRONTEND_PID