#!/bin/bash

# 需求管理系统停止脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}正在停止需求管理系统...${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# PID 文件路径
BACKEND_PID_FILE="/tmp/ipd_backend.pid"
FRONTEND_PID_FILE="/tmp/ipd_frontend.pid"

# 从 PID 文件读取 PID 并停止
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止后端服务 (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ 后端服务已停止${NC}"
    else
        echo -e "${YELLOW}后端服务未在运行${NC}"
    fi
    rm -f "$BACKEND_PID_FILE"
fi

if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止前端服务 (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ 前端服务已停止${NC}"
    else
        echo -e "${YELLOW}前端服务未在运行${NC}"
    fi
    rm -f "$FRONTEND_PID_FILE"
fi

# 额外清理：检查端口 8000 和 5173-5178
echo -e "${YELLOW}清理可能残留的进程...${NC}"
for PORT in 8000 5173 5174 5175; do
    PID=$(lsof -ti:$PORT 2>/dev/null | head -1)
    if [ -n "$PID" ]; then
        echo -e "${YELLOW}  停止端口 $PORT 上的进程 (PID: $PID)...${NC}"
        kill -9 $PID 2>/dev/null || true
    fi
done

echo -e "${GREEN}✓ 需求管理系统已完全停止${NC}"
