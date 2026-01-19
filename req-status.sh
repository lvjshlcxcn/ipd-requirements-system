#!/bin/bash

# 需求管理系统状态检查脚本
# 用于检查前后端服务运行状态

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  需求管理系统状态检查${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 服务配置
BACKEND_PORT=8000
FRONTEND_DEFAULT_PORT=5173
FRONTEND_PORTS=(5173 5174 5175 5176 5177 5178)
DB_NAME="ipd_req_db"
DB_USER="ipd_user"

# ============================================
# 1. 检查后端服务
# ============================================
echo -e "${CYAN}[1/6] 后端服务状态${NC}"
echo ""

BACKEND_PIDS=$(lsof -ti :$BACKEND_PORT 2>/dev/null | tr '\n' ' ' | xargs)
BACKEND_PID=$(echo $BACKEND_PIDS | awk '{print $1}')
if [ -n "$BACKEND_PID" ]; then
    BACKEND_CMD=$(ps -p $BACKEND_PID -o command= 2>/dev/null)
    BACKEND_UPTIME=$(ps -p $BACKEND_PID -o etime= 2>/dev/null | xargs)
    BACKEND_MEM=$(ps -p $BACKEND_PID -o rss= 2>/dev/null | awk '{printf "%.1fMB", $1/1024}')
    BACKEND_CPU=$(ps -p $BACKEND_PID -o %cpu= 2>/dev/null)
    
    echo -e "${GREEN}✓ 后端服务运行中${NC}"
    echo -e "  PID: $BACKEND_PID"
    echo -e "  命令: $BACKEND_CMD"
    echo -e "  运行时间: $BACKEND_UPTIME"
    echo -e "  内存占用: $BACKEND_MEM"
    echo -e "  CPU使用: ${BACKEND_CPU}%"
    echo -e "  地址: http://localhost:$BACKEND_PORT"
    
    # 测试API健康检查
    if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}健康检查: 正常${NC}"
    else
        echo -e "  ${YELLOW}健康检查: 无响应${NC}"
    fi
else
    echo -e "${RED}✗ 后端服务未运行${NC}"
    echo -e "  端口 $BACKEND_PORT 未被监听"
fi
echo ""

# ============================================
# 2. 检查前端服务
# ============================================
echo -e "${CYAN}[2/6] 前端服务状态${NC}"
echo ""

FRONTEND_PID=""
FRONTEND_PORT=""

# 检查可能的端口
for port in "${FRONTEND_PORTS[@]}"; do
    # 获取该端口所有进程
    PIDS=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$PIDS" ]; then
        # 检查每个进程是否是 vite 或 npm
        for PID in $PIDS; do
            CMD=$(ps -p $PID -o command= 2>/dev/null || echo "")
            if echo "$CMD" | grep -q "vite\|npm"; then
                FRONTEND_PID=$PID
                FRONTEND_PORT=$port
                break 2  # 跳出两层循环
            fi
        done
    fi
done

if [ -n "$FRONTEND_PID" ]; then
    FRONTEND_CMD=$(ps -p $FRONTEND_PID -o command= 2>/dev/null || echo "")
    FRONTEND_UPTIME=$(ps -p $FRONTEND_PID -o etime= 2>/dev/null | xargs || echo "")
    FRONTEND_MEM=$(ps -p $FRONTEND_PID -o rss= 2>/dev/null | awk '{printf "%.1fMB", $1/1024}' || echo "N/A")
    FRONTEND_CPU=$(ps -p $FRONTEND_PID -o %cpu= 2>/dev/null || echo "N/A")
    
    echo -e "${GREEN}✓ 前端服务运行中${NC}"
    echo -e "  PID: $FRONTEND_PID"
    echo -e "  命令: $FRONTEND_CMD"
    echo -e "  运行时间: $FRONTEND_UPTIME"
    echo -e "  内存占用: $FRONTEND_MEM"
    echo -e "  CPU使用: ${FRONTEND_CPU}%"
    echo -e "  地址: http://localhost:$FRONTEND_PORT"
else
    echo -e "${RED}✗ 前端服务未运行${NC}"
    echo -e "  端口 ${FRONTEND_PORTS[@]} 均未被监听"
fi
echo ""

# ============================================
# 3. 检查数据库连接
# ============================================
echo -e "${CYAN}[3/6] 数据库状态${NC}"
echo ""

if command -v psql >/dev/null 2>&1; then
    # 测试数据库连接
    if PGPASSWORD="ipd_pass" psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ 数据库连接正常${NC}"
        echo -e "  数据库: $DB_NAME"
        echo -e "  用户: $DB_USER"
        
        # 查询需求数量
        REQ_COUNT=$(PGPASSWORD="ipd_pass" psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM requirements;" 2>/dev/null | tail -n +2)
        if [ -n "$REQ_COUNT" ] && [ "$REQ_COUNT" != "" ]; then
            echo -e "  需求数量: $REQ_COUNT"
        fi
        
        # 查询追溯关联数量
        TRACE_COUNT=$(PGPASSWORD="ipd_pass" psql -h localhost -U ipd_user -d $DB_NAME -t -c "SELECT COUNT(*) FROM traceability_links;" 2>/dev/null | tail -n +2)
        if [ -n "$TRACE_COUNT" ] && [ "$TRACE_COUNT" != "" ]; then
            echo -e "  追溯关联: $TRACE_COUNT"
        fi
    else
        echo -e "${RED}✗ 数据库连接失败${NC}"
    fi
else
    echo -e "${YELLOW}⚠ psql 未安装，无法检查数据库${NC}"
fi
echo ""

# ============================================
# 4. 检查日志文件
# ============================================
echo -e "${CYAN}[4/6] 日志文件${NC}"
echo ""

LOG_FILES=(
    "/tmp/ipd_backend.log:后端日志"
    "/tmp/ipd_frontend.log:前端日志"
)

for log_entry in "${LOG_FILES[@]}"; do
    LOG_FILE=$(echo $log_entry | cut -d: -f1)
    LOG_NAME=$(echo $log_entry | cut -d: -f2)
    
    if [ -f "$LOG_FILE" ]; then
        SIZE=$(ls -lh "$LOG_FILE" | awk '{print $5}')
        LINES=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")
        # macOS stat 命令格式
        LAST_MOD=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$LOG_FILE" 2>/dev/null || stat -c "%y" "$LOG_FILE" 2>/dev/null | cut -d'.' -f1 || echo "Unknown")
        echo -e "${GREEN}✓ $LOG_NAME${NC}"
        echo -e "  文件: $LOG_FILE"
        echo -e "  大小: $SIZE"
        echo -e "  行数: $LINES"
        echo -e "  最后更新: $LAST_MOD"
    else
        echo -e "${YELLOW}○ $LOG_NAME (文件不存在)${NC}"
    fi
done
echo ""

# ============================================
# 5. 检查端口占用
# ============================================
echo -e "${CYAN}[5/6] 端口占用详情${NC}"
echo ""

PORTS_TO_CHECK=($BACKEND_PORT 5173 5174 5175 5176)
for port in "${PORTS_TO_CHECK[@]}"; do
    PID=$(lsof -ti :$port 2>/dev/null | head -1)
    if [ -n "$PID" ]; then
        CMD=$(ps -p $PID -o command= 2>/dev/null || echo "unknown")
        echo -e "端口 $port: ${GREEN}占用${NC} (PID: $PID, $CMD)"
    else
        echo -e "端口 $port: ${GREEN}空闲${NC}"
    fi
done
echo ""

# ============================================
# 6. 服务URL汇总
# ============================================
echo -e "${CYAN}[6/6] 访问地址${NC}"
echo ""

if [ -n "$BACKEND_PID" ] && [ -n "$FRONTEND_PID" ]; then
    echo -e "${GREEN}所有服务运行正常！${NC}"
    echo ""
    echo -e "${BLUE}访问地址：${NC}"
    echo -e "  🌐 前端应用: ${GREEN}http://localhost:$FRONTEND_PORT/${NC}"
    echo -e "  🔧 后端API:  ${GREEN}http://localhost:$BACKEND_PORT/${NC}"
    echo -e "  📚 API文档:  ${GREEN}http://localhost:$BACKEND_PORT/docs${NC}"
    echo ""
    echo -e "${BLUE}默认登录：${NC}"
    echo -e "  用户名: ${YELLOW}admin${NC}"
    echo -e "  密码: ${YELLOW}admin123${NC}"
elif [ -n "$BACKEND_PID" ]; then
    echo -e "${YELLOW}⚠ 仅后端服务运行${NC}"
    echo -e "  后端: http://localhost:$BACKEND_PORT/"
elif [ -n "$FRONTEND_PID" ]; then
    echo -e "${YELLOW}⚠ 仅前端服务运行${NC}"
    echo -e "  前端: http://localhost:$FRONTEND_PORT/"
else
    echo -e "${RED}✗ 所有服务均未运行${NC}"
    echo -e ""
    echo -e "${YELLOW}启动命令:${NC}"
    echo -e "  $SCRIPT_DIR/req-start.sh"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${CYAN}检查完成！${NC}"
echo -e "${BLUE}========================================${NC}"
