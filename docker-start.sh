#!/bin/bash

# IPD 需求管理系统 - Docker 快速启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# 检查 Docker 是否安装
check_docker() {
    print_header "检查 Docker 环境"

    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker Desktop"
        echo "下载地址: https://www.docker.com/products/docker-desktop/"
        exit 1
    fi
    print_success "Docker 已安装: $(docker --version)"

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装"
        exit 1
    fi
    print_success "Docker Compose 已安装"
}

# 检查端口占用
check_ports() {
    print_header "检查端口占用"

    PORTS=(5432 6379 8000 5173)
    PORT_NAMES=("PostgreSQL" "Redis" "Backend" "Frontend")

    for i in "${!PORTS[@]}"; do
        PORT=${PORTS[$i]}
        NAME=${PORT_NAMES[$i]}

        if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "${NAME} 端口 $PORT 已被占用"
        else
            print_success "${NAME} 端口 $PORT 可用"
        fi
    done
}

# 创建 .env 文件
create_env_file() {
    print_header "配置环境变量"

    if [ ! -f .env ]; then
        print_info "创建 .env 文件..."
        echo "DEEPSEEK_API_KEY=sk-154cca2f691445d5b7df8bbc1ff43b7b" > .env
        print_success ".env 文件已创建"
    else
        print_info ".env 文件已存在"
    fi
}

# 启动服务
start_services() {
    print_header "启动 Docker 服务"

    print_info "构建并启动所有容器..."
    docker-compose up -d --build

    echo ""
    print_info "等待服务启动..."
    sleep 5

    # 检查服务状态
    print_header "服务状态"
    docker-compose ps

    echo ""
    print_success "所有服务已启动！"
}

# 显示访问信息
show_access_info() {
    print_header "访问信息"

    echo -e "${GREEN}前端应用:${NC}     http://localhost:5173"
    echo -e "${GREEN}后端 API:${NC}      http://localhost:8000"
    echo -e "${GREEN}API 文档:${NC}      http://localhost:8000/docs"
    echo -e "${GREEN}健康检查:${NC}      http://localhost:8000/health"
    echo ""
    echo -e "${BLUE}默认登录账号:${NC}"
    echo -e "  用户名: ${GREEN}admin${NC}"
    echo -e "  密码: ${GREEN}admin123${NC}"
}

# 显示常用命令
show_commands() {
    print_header "常用命令"

    echo -e "${BLUE}查看日志:${NC}"
    echo "  docker-compose logs -f"
    echo ""
    echo -e "${BLUE}查看后端日志:${NC}"
    echo "  docker-compose logs -f backend"
    echo ""
    echo -e "${BLUE}查看前端日志:${NC}"
    echo "  docker-compose logs -f frontend"
    echo ""
    echo -e "${BLUE}停止服务:${NC}"
    echo "  docker-compose down"
    echo ""
    echo -e "${BLUE}重启服务:${NC}"
    echo "  docker-compose restart"
    echo ""
    echo -e "${BLUE}进入后端容器:${NC}"
    echo "  docker-compose exec backend bash"
    echo ""
    echo -e "${BLUE}进入数据库:${NC}"
    echo "  docker-compose exec postgres psql -U ipd_user -d ipd_req_db"
}

# 主函数
main() {
    clear

    cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                              ║
║          IPD 需求管理系统 - Docker 快速启动工具              ║
║                                                              ║
╚════════════════════════════════════════════════════════════╝
EOF

    check_docker
    check_ports
    create_env_file
    start_services
    show_access_info
    show_commands

    print_header "完成"
    print_success "系统已就绪！请访问 http://localhost:5173 开始使用"
    echo ""
}

# 运行主函数
main
