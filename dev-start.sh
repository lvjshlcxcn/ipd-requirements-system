#!/bin/bash

# 开发环境启动脚本
# 启动前端和后端服务

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "    启动需求管理系统 - 开发环境"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  端口 $port 已被占用${NC}"
        return 1
    fi
    return 0
}

# 检查后端虚拟环境
if [ ! -d "$BACKEND_DIR/.venv" ]; then
    echo -e "${RED}❌ 后端虚拟环境不存在${NC}"
    echo "请先运行: cd backend && python3 -m venv .venv"
    exit 1
fi

# 检查前端依赖
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠️  前端依赖未安装，正在安装...${NC}"
    cd "$FRONTEND_DIR"
    npm install
    cd "$SCRIPT_DIR"
fi

# 检查端口
echo -e "${BLUE}🔍 检查端口占用...${NC}"
if ! check_port 8000; then
    echo -e "${RED}❌ 后端端口 8000 被占用，请先关闭占用该端口的进程${NC}"
    echo "运行命令查看: lsof -i :8000"
    exit 1
fi

if ! check_port 5173; then
    echo -e "${RED}❌ 前端端口 5173 被占用，请先关闭占用该端口的进程${NC}"
    echo "运行命令查看: lsof -i :5173"
    exit 1
fi

echo -e "${GREEN}✅ 端口检查通过${NC}"
echo ""

# 创建日志目录
mkdir -p logs

# 启动后端
echo -e "${BLUE}🚀 启动后端服务...${NC}"
cd "$BACKEND_DIR"
source .venv/bin/activate

# 后台启动后端，记录日志
nohup uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --log-level info \
    > "$SCRIPT_DIR/logs/backend.log" 2>&1 &

BACKEND_PID=$!
echo $BACKEND_PID > "$SCRIPT_DIR/logs/backend.pid"

echo -e "${GREEN}✅ 后端已启动 (PID: $BACKEND_PID)${NC}"
echo -e "   日志文件: logs/backend.log"
echo -e "   API 文档: http://localhost:8000/docs"

# 等待后端启动
echo -e "${YELLOW}⏳ 等待后端服务就绪...${NC}"
sleep 3

# 检查后端是否启动成功
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ 后端启动失败，请查看日志: logs/backend.log${NC}"
    exit 1
fi

cd "$SCRIPT_DIR"
echo ""

# 启动前端
echo -e "${BLUE}🚀 启动前端服务...${NC}"
cd "$FRONTEND_DIR"

# 后台启动前端，记录日志
nohup npm run dev \
    > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &

FRONTEND_PID=$!
echo $FRONTEND_PID > "$SCRIPT_DIR/logs/frontend.pid"

echo -e "${GREEN}✅ 前端已启动 (PID: $FRONTEND_PID)${NC}"
echo -e "   日志文件: logs/frontend.log"

cd "$SCRIPT_DIR"
echo ""

# 等待前端启动
echo -e "${YELLOW}⏳ 等待前端服务就绪...${NC}"
sleep 3

# 最终状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 开发环境启动完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📱 服务地址：${NC}"
echo -e "   前端: ${GREEN}http://localhost:5173${NC}"
echo -e "   后端: ${GREEN}http://localhost:8000${NC}"
echo -e "   API文档: ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}📋 管理命令：${NC}"
echo -e "   查看状态: ${YELLOW}./dev-status.sh${NC}"
echo -e "   停止服务: ${YELLOW}./dev-stop.sh${NC}"
echo -e "   查看日志: ${YELLOW}tail -f logs/backend.log${NC} 或 ${YELLOW}tail -f logs/frontend.log${NC}"
echo ""
