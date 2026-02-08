#!/bin/bash

echo "=== 添加admin到会议参会人员 ==="

# 获取token（需要先登录密码）
echo "请先登录获取token..."
echo "运行以下命令登录："
echo ""
echo "curl -X POST http://localhost:8000/api/v1/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\": \"admin\", \"password\": \"admin123\"}'"
echo ""
echo "然后使用返回的token运行："
echo ""
echo "curl -X POST http://localhost:8000/api/v1/review-meetings/60/attendees \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \\"
echo "  -d '{\"attendee_id\": 1}'"
