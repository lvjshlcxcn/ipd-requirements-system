#!/bin/bash

# 开发环境状态检查脚本
# 检查前端和后端服务运行状态

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "    需求管理系统 - 服务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查进程状态的函数
check_service() {
    local name=$1
    local port=$2
    local pid_file=$3
    local log_file=$4

    echo -e "${BLUE}📊 $name:${NC}"

    # 检查端口
    port_pid=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$port_pid" ]; then
        echo -e "   端口 $port: ${GREEN}✅ 运行中${NC} (PID: $port_pid)"

        # 显示进程信息
        proc_info=$(ps -p $port_pid -o command= 2>/dev/null || true)
        if [ -n "$proc_info" ]; then
            echo -e "   进程: $proc_info"
        fi

        # 显示内存使用
        mem_usage=$(ps -p $port_pid -o rss= 2>/dev/null | awk '{printf "%.1f MB", $1/1024}' || true)
        if [ -n "$mem_usage" ]; then
            echo -e "   内存: ${mem_usage}"
        fi
    else
        echo -e "   端口 $port: ${RED}❌ 未运行${NC}"
    fi

    # 检查 PID 文件
    if [ -f "$pid_file" ]; then
        saved_pid=$(cat "$pid_file")
        if ps -p $saved_pid > /dev/null 2>&1; then
            echo -e "   PID文件: ${GREEN}✅ 有效${NC} ($saved_pid)"
        else
            echo -e "   PID文件: ${YELLOW}⚠️  过期${NC} (进程不存在)"
        fi
    else
        echo -e "   PID文件: ${YELLOW}⚠️  不存在${NC}"
    fi

    # 检查日志文件
    if [ -f "$log_file" ]; then
        log_size=$(du -h "$log_file" | cut -f1)
        log_lines=$(wc -l < "$log_file" 2>/dev/null || echo "0")
        echo -e "   日志: ${GREEN}✅ 存在${NC} (${log_size}, ${log_lines} 行)"
        echo -e "   路径: $log_file"
    else
        echo -e "   日志: ${YELLOW}⚠️  不存在${NC}"
    fi

    echo ""
}

# 检查后端
check_service "后端服务" "8000" "$SCRIPT_DIR/logs/backend.pid" "$SCRIPT_DIR/logs/backend.log"

# 检查前端
check_service "前端服务" "5173" "$SCRIPT_DIR/logs/frontend.pid" "$SCRIPT_DIR/logs/frontend.log"

# 检查数据库
echo -e "${BLUE}📊 数据库:${NC}"
if [ -f "$SCRIPT_DIR/backend/ipd_req.db" ]; then
    db_size=$(du -h "$SCRIPT_DIR/backend/ipd_req.db" | cut -f1)
    echo -e "   SQLite: ${GREEN}✅ 存在${NC} (${db_size})"
    echo -e "   路径: backend/ipd_req.db"
else
    echo -e "   SQLite: ${RED}❌ 不存在${NC}"
fi
echo ""

# 快速访问链接
echo -e "${BLUE}🔗 快速访问:${NC}"
backend_running=$(lsof -ti :8000 2>/dev/null || true)
frontend_running=$(lsof -ti :5173 2>/dev/null || true)

if [ -n "$backend_running" ]; then
    echo -e "   后端API: ${GREEN}http://localhost:8000${NC}"
    echo -e "   API文档: ${GREEN}http://localhost:8000/docs${NC}"
else
    echo -e "   后端API: ${RED}未运行${NC}"
fi

if [ -n "$frontend_running" ]; then
    echo -e "   前端页面: ${GREEN}http://localhost:5173${NC}"
else
    echo -e "   前端页面: ${RED}未运行${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 返回状态码
if [ -n "$backend_running" ] && [ -n "$frontend_running" ]; then
    echo -e "${GREEN}✅ 所有服务运行正常${NC}"
    exit 0
elif [ -n "$backend_running" ] || [ -n "$frontend_running" ]; then
    echo -e "${YELLOW}⚠️  部分服务运行中${NC}"
    exit 1
else
    echo -e "${RED}❌ 所有服务未运行${NC}"
    exit 2
fi
