#!/bin/bash

echo "=========================================="
echo "  启动需求评审投票系统 - 后端服务"
echo "=========================================="
echo ""

# 激活虚拟环境
source .venv/bin/activate

# 检查环境变量
if [ ! -f .env ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "请先创建 .env 文件并配置必要的环境变量"
    exit 1
fi

echo "✅ 虚拟环境已激活"
echo "✅ 环境变量已加载"
echo ""

# 运行数据库迁移
echo "📊 运行数据库迁移..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ 数据库迁移成功"
else
    echo "❌ 数据库迁移失败"
    exit 1
fi

echo ""

# 启动服务
echo "🚀 启动后端服务..."
echo "API文档: http://localhost:8000/docs"
echo "健康检查: http://localhost:8000/api/v1/health"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 开发模式
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
