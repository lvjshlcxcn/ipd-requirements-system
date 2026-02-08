#!/bin/bash
# 数据库列缺失快速修复脚本

echo "====================================="
echo "  数据库列缺失快速修复"
echo "====================================="
echo ""
echo "检查后端状态..."

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ 后端正在运行"
    echo ""
    echo "请按照以下步骤操作："
    echo ""
    echo "1. 打开浏览器访问:"
    echo "   http://localhost:8000/docs"
    echo ""
    echo "2. 在页面中找到:"
    echo "   POST /api/v1/migration/add-assigned-voter-ids-column"
    echo ""
    echo "3. 点击按钮:"
    echo "   [Try it out] → [Execute]"
    echo ""
    echo "4. 看到成功响应后，刷新前端页面"
    echo ""
else
    echo "❌ 后端未运行"
    echo ""
    echo "请先启动后端服务器："
    echo "  cd backend"
    echo "  uvicorn app.main:app --reload"
    echo ""
    echo "然后再运行此脚本"
fi

echo "====================================="
echo ""
