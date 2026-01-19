#!/bin/bash

# 需求管理系统启动脚本
# 功能：启动后端和前端服务，并在浏览器中打开应用

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  需求管理系统启动脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查端口占用
echo -e "${YELLOW}[1/5] 检查端口占用情况...${NC}"
BACKEND_PORT=8000
FRONTEND_PORT=5173

check_port() {
    local port=$1
    local service_name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${RED}✗ 端口 $port 已被占用 ($service_name)${NC}"
        echo -e "${YELLOW}  正在尝试停止占用端口的进程...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    echo -e "${GREEN}✓ 端口 $port 可用 ($service_name)${NC}"
}

check_port $BACKEND_PORT "后端服务"
check_port $FRONTEND_PORT "前端服务"
echo ""

# 启动后端服务
echo -e "${YELLOW}[2/5] 启动后端服务...${NC}"
cd "$SCRIPT_DIR/backend"

# 激活虚拟环境并启动后端
if [ ! -d "venv" ]; then
    echo -e "${RED}✗ 虚拟环境不存在，请先创建${NC}"
    exit 1
fi

source venv/bin/activate
echo -e "${GREEN}✓ 后端服务启动中 (端口 $BACKEND_PORT)...${NC}"

# 后台启动后端
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload \
    > /tmp/ipd_backend.log 2>&1 \
    &

BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"
echo ""

# 等待后端启动
echo -e "${YELLOW}等待后端服务启动...${NC}"
sleep 3

# 检查后端是否启动成功
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}✗ 后端服务启动失败，请查看日志: /tmp/ipd_backend.log${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 后端服务启动成功${NC}"
echo ""

# 启动前端服务
echo -e "${YELLOW}[3/5] 启动前端服务...${NC}"
cd "$SCRIPT_DIR/frontend"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}正在安装前端依赖...${NC}"
    npm install
fi

echo -e "${GREEN}✓ 前端服务启动中 (端口 $FRONTEND_PORT)...${NC}"

# 后台启动前端
nohup npm run dev > /tmp/ipd_frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"
echo ""

# 等待前端启动
echo -e "${YELLOW}等待前端服务启动...${NC}"
sleep 3

# 检查前端是否启动成功
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${RED}✗ 前端服务启动失败，请查看日志: /tmp/ipd_frontend.log${NC}"
    exit 1
fi

# 检查前端日志确定实际端口
ACTUAL_PORT=$(grep -o "Local:.*http://localhost:[0-9]*" /tmp/ipd_frontend.log | grep -o "[0-9]*" | tail -1)
if [ -z "$ACTUAL_PORT" ]; then
    ACTUAL_PORT=$FRONTEND_PORT
fi
echo -e "${GREEN}✓ 前端服务启动成功 (实际端口: $ACTUAL_PORT)${NC}"
echo ""

# 保存PID到文件，方便后续停止
echo "$BACKEND_PID" > /tmp/ipd_backend.pid
echo "$FRONTEND_PID" > /tmp/ipd_frontend.pid

# 打印服务信息
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ 需求管理系统启动成功！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}后端服务:${NC} http://localhost:$BACKEND_PORT"
echo -e "${GREEN}前端服务:${NC} http://localhost:$ACTUAL_PORT"
echo -e "${GREEN}API文档:${NC}  http://localhost:$BACKEND_PORT/docs"
echo ""
echo -e "${YELLOW}后端日志: tail -f /tmp/ipd_backend.log${NC}"
echo -e "${YELLOW}前端日志: tail -f /tmp/ipd_frontend.log${NC}"
echo ""
echo -e "${YELLOW}停止服务:${NC} kill $BACKEND_PID $FRONTEND_PID"
echo -e "${YELLOW}          或: kill \$(cat /tmp/ipd_backend.pid) \$(cat /tmp/ipd_frontend.pid)"
echo ""

# 自动打开浏览器
echo -e "${YELLOW}[4/5] 在浏览器中打开应用...${NC}"

# 检测操作系统并打开浏览器
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "http://localhost:$ACTUAL_PORT"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open > /dev/null; then
        xdg-open "http://localhost:$ACTUAL_PORT"
    elif command -v gnome-open > /dev/null; then
        gnome-open "http://localhost:$ACTUAL_PORT"
    else
        echo -e "${YELLOW}请手动打开浏览器访问: http://localhost:$ACTUAL_PORT${NC}"
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start "" "http://localhost:$ACTUAL_PORT"
else
    echo -e "${YELLOW}请手动打开浏览器访问: http://localhost:$ACTUAL_PORT${NC}"
fi

echo -e "${GREEN}✓ 浏览器已打开${NC}"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}[5/5] 系统正在运行中...${NC}"
echo -e "${YELLOW}按 Ctrl+C 停止此脚本不会停止服务${NC}"
echo -e "${YELLOW}要停止服务，请运行: kill $BACKEND_PID $FRONTEND_PID${NC}"
echo -e "${BLUE}========================================${NC}"

# 保持脚本运行
wait
