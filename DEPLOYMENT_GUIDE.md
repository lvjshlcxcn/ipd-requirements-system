# 部署指南 - 需求评审投票系统

## 🚀 快速部署

### 前置条件检查

```bash
# 1. 检查Python版本（需要3.9+）
python3 --version

# 2. 检查Node版本（需要16+）
node --version

# 3. 检查PostgreSQL状态
pg_isready -h localhost -p 5432

# 4. 检查Redis状态（如果使用）
redis-cli ping
```

---

## 后端部署

### 步骤1: 进入后端目录
```bash
cd /Users/kingsun/claude_study/backend
```

### 步骤2: 激活虚拟环境
```bash
source .venv/bin/activate
```

### 步骤3: 安装依赖
```bash
pip install -r requirements.txt
```

### 步骤4: 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件
vim .env
```

**必需的环境变量**:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
DEBUG=False
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 步骤5: 运行数据库迁移
```bash
alembic upgrade head
```

### 步骤6: 运行测试验证
```bash
pytest tests/ -v --tb=short
```

### 步骤7: 启动后端服务

**开发模式**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**生产模式**（推荐）:
```bash
# 使用gunicorn（需要安装）
pip install gunicorn

gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### 步骤8: 验证后端服务
```bash
# 健康检查
curl http://localhost:8000/api/v1/health

# API文档
open http://localhost:8000/docs
```

---

## 前端部署

### 步骤1: 进入前端目录
```bash
cd /Users/kingsun/claude_study/frontend
```

### 步骤2: 安装依赖
```bash
npm install
```

### 步骤3: 配置环境变量
```bash
# 创建.env文件
cat > .env << 'ENV'
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
ENV
```

### 步骤4: 运行测试
```bash
npm test -- --run
```

### 步骤5: 构建生产版本
```bash
npm run build
```

### 步骤6: 预览构建
```bash
npm run preview
```

### 步骤7: 使用nginx部署

**安装nginx**:
```bash
# macOS
brew install nginx

# Ubuntu/Debian
sudo apt-get install nginx
```

**配置nginx**:
```bash
sudo vim /etc/nginx/sites-available/review-system
```

**nginx配置**:
```nginx
server {
    listen 80;
    server_name localhost;

    # 前端静态文件
    location / {
        root /Users/kingsun/claude_study/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket支持
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**启用配置**:
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/review-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启nginx
sudo systemctl restart nginx
# 或 macOS
sudo brew services restart nginx
```

---

## Docker部署（推荐）

### 后端Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 前端Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: review_db
      POSTGRES_USER: review_user
      POSTGRES_PASSWORD: review_pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://review_user:review_pass@postgres:5432/review_db
      REDIS_URL: redis://redis:6379/0
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "80:80"

volumes:
  postgres_data:
```

### 启动Docker服务
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 验证部署

### 1. 后端健康检查
```bash
curl http://localhost:8000/api/v1/health
```

**预期响应**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-04T..."
}
```

### 2. 前端访问
```bash
open http://localhost:80
# 或
open http://localhost:5173  # 开发模式
```

### 3. 运行冒烟测试
```bash
cd /Users/kingsun/claude_study/backend
pytest tests/smoke/ -v
```

### 4. 功能验证清单
- [ ] 登录系统
- [ ] 创建会议
- [ ] 添加参会人员
- [ ] 添加需求
- [ ] 开始会议
- [ ] 参会人员投票
- [ ] 查看投票统计
- [ ] 结束会议
- [ ] 查看结果存档

---

## 监控和日志

### 查看后端日志
```bash
# 开发模式
# 直接在终端查看

# 生产模式（使用systemd）
sudo journalctl -u backend-service -f

# Docker模式
docker-compose logs -f backend
```

### 查看nginx日志
```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

---

## 故障排除

### 问题1: 端口被占用
```bash
# 查找占用端口的进程
lsof -i :8000

# 杀死进程
kill -9 <PID>

# 或使用其他端口
uvicorn app.main:app --port 8001
```

### 问题2: 数据库连接失败
```bash
# 检查PostgreSQL状态
pg_isready -h localhost -p 5432

# 检查连接
psql -h localhost -U postgres -d review_db

# 检查防火墙
sudo ufw allow 5432
```

### 问题3: 前端无法连接后端
```bash
# 检查CORS配置
# 确保后端CORS_ORIGINS包含前端地址

# 检查nginx配置
sudo nginx -t

# 重启nginx
sudo systemctl restart nginx
```

---

## 回滚

### 快速回滚步骤
```bash
# 1. 停止服务
systemctl stop backend-service
systemctl stop nginx

# 2. 恢复代码
git checkout previous_version

# 3. 恢复数据库
psql -h localhost -U postgres -d review_db < backup_YYYYMMDD.sql

# 4. 重启服务
systemctl start backend-service
systemctl start nginx
```

---

## 支持

如有问题，请查看：
- [维护指南](./MAINTENANCE_GUIDE.md)
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)
- [完整项目总结](./TDD_PROJECT_COMPLETE_SUMMARY.md)

---

**部署指南版本**: 1.0
**最后更新**: 2026-02-04
