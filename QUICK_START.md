# 快速启动指南

## 🚀 一键启动

### 方式1: 使用启动脚本（推荐）

**启动后端**:
```bash
cd /Users/kingsun/claude_study/backend
./start.sh
```

**启动前端**（新终端窗口）:
```bash
cd /Users/kingsun/claude_study/frontend
./start.sh
```

### 方式2: 手动启动

**后端**:
```bash
cd /Users/kingsun/claude_study/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**前端**:
```bash
cd /Users/kingsun/claude_study/frontend
npm run dev
```

---

## 📍 访问地址

启动成功后，访问以下地址：

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/api/v1/health

---

## ✅ 验证服务

### 1. 检查后端健康
```bash
curl http://localhost:8000/api/v1/health
```

**预期响应**:
```json
{
  "status": "healthy"
}
```

### 2. 运行快速测试
```bash
cd /Users/kingsun/claude_study/backend
pytest tests/integration/test_api/test_requirement_review_meetings_api.py -v -k "test_create_meeting"
```

### 3. 访问前端
在浏览器打开: http://localhost:5173

---

## 🔧 常见问题

### 端口被占用
```bash
# 查找占用8000端口的进程
lsof -i :8000

# 杀死进程
kill -9 <PID>

# 或使用其他端口
uvicorn app.main:app --port 8001
```

### 数据库连接失败
```bash
# 检查PostgreSQL状态
pg_isready -h localhost -p 5432

# 启动PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
```

### 前端构建失败
```bash
# 清理并重新安装
cd /Users/kingsun/claude_study/frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 服务状态检查

### 后端日志
查看终端输出或检查:
```bash
tail -f /var/log/backend-service/app.log
```

### 前端日志
查看浏览器控制台（F12）

---

## 🛑 停止服务

按 `Ctrl+C` 停止服务

---

## 📚 更多信息

- [完整部署指南](./DEPLOYMENT_GUIDE.md)
- [维护指南](./MAINTENANCE_GUIDE.md)
- [项目文档](./README.md)

---

**快速启动版本**: 1.0
**最后更新**: 2026-02-04
