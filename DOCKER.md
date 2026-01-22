# Docker 开发环境指南

本文档介绍如何使用 Docker 启动 IPD 需求管理系统的开发环境。

## 📋 前置要求

确保已安装以下软件：
- Docker Desktop (Mac/Windows) 或 Docker Engine (Linux)
- Docker Compose

验证安装：
```bash
docker --version
docker-compose --version
```

## 🚀 快速启动

### 1. 克隆项目（如果还没有）
```bash
git clone https://github.com/lvjshlcxcn/ipd-requirements-system.git
cd ipd-requirements-system
```

### 2. 配置环境变量（可选）

创建 `.env` 文件在项目根目录：
```bash
cat > .env << 'ENVEOF'
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-your-api-key-here
ENVEOF
```

如果不创建，将使用默认的 API Key（仅供测试）。

### 3. 启动所有服务

```bash
# 在项目根目录执行
docker-compose up -d
```

这将启动以下服务：
- **PostgreSQL** (端口 5432) - 数据库
- **Redis** (端口 6379) - 缓存
- **Backend** (端口 8000) - FastAPI 后端
- **Frontend** (端口 5173) - React 前端

### 4. 查看服务状态

```bash
docker-compose ps
```

### 5. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 6. 访问应用

- **前端**: http://localhost:5173
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health

### 7. 停止服务

```bash
docker-compose down
```

### 8. 完全清理（包括数据卷）

```bash
docker-compose down -v
```

## 🛠️ 开发工作流

### 热重载

Docker 配置已启用代码热重载：
- **后端**: 修改 Python 代码后自动重启
- **前端**: 修改 React/Vite 代码后自动刷新

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend bash

# 进入前端容器
docker-compose exec frontend sh

# 进入 PostgreSQL
docker-compose exec postgres psql -U ipd_user -d ipd_req_db

# 进入 Redis
docker-compose exec redis redis-cli
```

### 运行数据库迁移

```bash
# 进入后端容器
docker-compose exec backend bash

# 运行迁移
alembic upgrade head

# 创建新迁移
alembic revision --autogenerate -m "描述"
```

### 安装新的 Python 依赖

```bash
# 1. 更新 requirements.txt
# 2. 重建容器
docker-compose up -d --build backend
```

### 安装新的 npm 依赖

```bash
# 1. 更新 package.json
# 2. 重建容器
docker-compose up -d --build frontend
```

## 🐛 常见问题

### 端口冲突

如果端口已被占用，修改 `docker-compose.yml` 中的端口映射：

```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # 改为 5433
  backend:
    ports:
      - "8001:8000"  # 改为 8001
  frontend:
    ports:
      - "5174:5173"  # 改为 5174
```

### 容器无法启动

1. 查看详细日志：
```bash
docker-compose logs backend
```

2. 检查容器状态：
```bash
docker-compose ps
```

3. 重建容器：
```bash
docker-compose down
docker-compose up -d --build
```

### 数据库连接失败

等待 PostgreSQL 完全启动（约 5-10 秒）：
```bash
docker-compose logs postgres
```

确认健康检查通过：
```bash
docker-compose ps
```

### 清理并重新开始

```bash
# 停止所有服务
docker-compose down

# 删除所有容器和卷
docker-compose down -v

# 删除镜像（可选）
docker-compose down -v --rmi all

# 重新构建并启动
docker-compose up -d --build
```

## 📊 服务架构

```
┌─────────────────────────────────────────┐
│             Docker Network              │
│  ┌─────────────┐  ┌──────────────┐     │
│  │  Frontend   │  │   Backend    │     │
│  │  (Node:18)  │──│  (Python:3.11)│    │
│  │  Port: 5173 │  │   Port: 8000 │     │
│  └─────────────┘  └──────┬───────┘     │
│                          │              │
│                          ▼              │
│  ┌─────────────┐  ┌──────────────┐    │
│  │  PostgreSQL │  │    Redis     │    │
│  │   Port:5432 │  │   Port:6379  │    │
│  └─────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

## 🔧 环境变量说明

### 后端环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | 数据库连接 URL |
| `REDIS_URL` | `redis://redis:6379` | Redis 连接 URL |
| `SECRET_KEY` | - | JWT 密钥 |
| `DEBUG` | `true` | 调试模式 |
| `DEEPSEEK_API_KEY` | - | DeepSeek API 密钥 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 模型名称 |

### 前端环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `VITE_API_URL` | `http://localhost:8000` | 后端 API 地址 |

## 📦 生产环境部署

生产环境需要修改以下内容：

1. **修改 `docker-compose.prod.yml`**：
   - 使用 `uvicorn` 不带 `--reload`
   - 添加更多的副本数
   - 配置健康检查
   - 使用持久化存储

2. **环境变量**：
   - `DEBUG=false`
   - 使用强密码和密钥
   - 配置 CORS 允许的域名

3. **构建镜像**：
```bash
docker-compose -f docker-compose.prod.yml build
```

4. **启动服务**：
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 相关文档

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [React 文档](https://react.dev/)

## 💡 提示

- 首次启动会下载镜像，需要等待几分钟
- 代码修改会自动热重载，无需重启容器
- 数据持久化在 Docker volume 中，重启不会丢失数据
- 生产环境请使用专门的 CI/CD 流程

## 🆘 获取帮助

遇到问题？
1. 查看本文档的"常见问题"部分
2. 检查容器日志：`docker-compose logs`
3. 查看 GitHub Issues

---

**文档版本**: v1.0  
**最后更新**: 2026-01-23
