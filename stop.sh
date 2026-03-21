#!/bin/bash
# AgentWork 停止脚本

echo "🛑 停止 AgentWork..."

pkill -f "node.*start-api" 2>/dev/null
pkill -f "node.*agentwork" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "✅ AgentWork 已停止"