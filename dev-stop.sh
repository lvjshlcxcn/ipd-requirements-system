#!/bin/bash

# 开发环境停止脚本
# 停止前端和后端服务

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "    停止需求管理系统 - 开发环境"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 停止进程的函数
stop_process() {
    local pid_file=$1
    local name=$2
    local port=$3

    # 方法1: 从 PID 文件读取
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}⏹️  正在停止 $name (PID: $pid)...${NC}"
            kill $pid 2>/dev/null || true
            sleep 1

            # 如果进程仍在运行，强制终止
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${YELLOW}⚠️  强制终止 $name...${NC}"
                kill -9 $pid 2>/dev/null || true
            fi

            echo -e "${GREEN}✅ $name 已停止${NC}"
        else
            echo -e "${YELLOW}⚠️  $name 进程不存在 (PID: $pid)${NC}"
        fi
        rm -f "$pid_file"
    fi

    # 方法2: 通过端口查找并停止
    if [ -n "$port" ]; then
        pid=$(lsof -ti :$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            echo -e "${YELLOW}⏹️  发现端口 $port 上的进程 (PID: $pid)，正在停止...${NC}"
            kill $pid 2>/dev/null || true
            sleep 1

            # 强制终止
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null || true
            fi
            echo -e "${GREEN}✅ 端口 $port 上的进程已停止${NC}"
        fi
    fi
}

# 停止后端
echo -e "${BLUE}🛑 停止后端服务...${NC}"
stop_process "$SCRIPT_DIR/logs/backend.pid" "后端" "8000"
echo ""

# 停止前端
echo -e "${BLUE}🛑 停止前端服务...${NC}"
stop_process "$SCRIPT_DIR/logs/frontend.pid" "前端" "5173"
echo ""

# 额外检查: 查找所有相关进程
echo -e "${BLUE}🔍 检查残留进程...${NC}"
remaining_procs=$(ps aux | grep -E "(uvicorn|vite|npm.*dev)" | grep -v grep | awk '{print $2}' || true)

if [ -n "$remaining_procs" ]; then
    echo -e "${YELLOW}⚠️  发现残留进程，正在清理...${NC}"
    echo "$remaining_procs" | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ 残留进程已清理${NC}"
else
    echo -e "${GREEN}✅ 无残留进程${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ 所有服务已停止${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}💡 提示：${NC}"
echo -e "   重新启动: ${YELLOW}./dev-start.sh${NC}"
echo ""
