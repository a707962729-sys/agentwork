#!/bin/bash

# AgentWork Web 快速启动脚本

echo "🚀 启动 AgentWork Web 管理前端..."

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🌐 启动开发服务器..."
echo "访问地址：http://localhost:5173"
npm run dev
