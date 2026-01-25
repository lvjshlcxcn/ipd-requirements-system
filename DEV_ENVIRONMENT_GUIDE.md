# 需求管理系统 - 开发环境使用指南

## 📋 概述

本指南介绍如何使用提供的脚本来管理需求管理系统的开发环境（前端和后端服务）。

---

## 🚀 快速开始

### 1. 启动开发环境

```bash
./dev-start.sh
```

**该脚本将：**
- ✅ 检查端口占用（8000 和 5173）
- ✅ 验证后端虚拟环境和前端依赖
- ✅ 启动后端服务（FastAPI + Uvicorn）
- ✅ 启动前端服务（Vite 开发服务器）
- ✅ 创建日志文件记录输出

**访问地址：**
- 🌐 前端：http://localhost:5173
- 🔧 后端 API：http://localhost:8000
- 📚 API 文档：http://localhost:8000/docs

---

### 2. 查看服务状态

```bash
./dev-status.sh
```

**显示信息：**
- 📊 后端服务状态（端口 8000）
- 📊 前端服务状态（端口 5173）
- 💾 数据库状态
- 📋 日志文件信息
- 💰 进程内存使用情况

**退出码：**
- `0` - 所有服务运行正常
- `1` - 部分服务运行中
- `2` - 所有服务未运行

---

### 3. 停止开发环境

```bash
./dev-stop.sh
```

**该脚本将：**
- 🛑 停止后端服务
- 🛑 停止前端服务
- 🧹 清理残留进程
- 🗑️ 删除 PID 文件

---

## 📂 项目结构

```
claude_study/
├── backend/                 # 后端服务（FastAPI）
│   ├── app/
│   │   └── main.py         # 后端入口
│   ├── .venv/              # Python 虚拟环境
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端服务（React + Vite）
│   ├── src/
│   ├── package.json        # Node 依赖
│   └── node_modules/       # 已安装的依赖
├── logs/                   # 服务日志目录
│   ├── backend.log         # 后端日志
│   ├── frontend.log        # 前端日志
│   ├── backend.pid         # 后端进程 ID
│   └── frontend.pid        # 前端进程 ID
├── dev-start.sh            # 启动脚本
├── dev-stop.sh             # 停止脚本
└── dev-status.sh           # 状态检查脚本
```

---

## 🛠️ 常用命令

### 启动环境
```bash
./dev-start.sh
```

### 检查状态
```bash
./dev-status.sh
```

### 停止环境
```bash
./dev-stop.sh
```

### 查看实时日志
```bash
# 后端日志
tail -f logs/backend.log

# 前端日志
tail -f logs/frontend.log

# 同时查看两个日志
tail -f logs/backend.log logs/frontend.log
```

### 检查端口占用
```bash
# 后端端口
lsof -i :8000

# 前端端口
lsof -i :5173
```

---

## 🔧 故障排查

### 问题：端口已被占用

**错误信息：**
```
❌ 后端端口 8000 被占用
```

**解决方案：**
```bash
# 查看占用端口的进程
lsof -i :8000

# 停止该进程
kill -9 <PID>

# 或使用停止脚本
./dev-stop.sh
```

---

### 问题：后端虚拟环境不存在

**错误信息：**
```
❌ 后端虚拟环境不存在
```

**解决方案：**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

### 问题：前端依赖未安装

**解决方案：**
```bash
cd frontend
npm install
cd ..
```

---

### 问题：服务启动失败

**排查步骤：**
1. 查看日志文件：
   ```bash
   cat logs/backend.log
   cat logs/frontend.log
   ```

2. 检查进程状态：
   ```bash
   ps aux | grep uvicorn  # 后端
   ps aux | grep vite     # 前端
   ```

3. 检查端口占用：
   ```bash
   lsof -i :8000
   lsof -i :5173
   ```

4. 重启环境：
   ```bash
   ./dev-stop.sh
   ./dev-start.sh
   ```

---

## 📊 服务端口

| 服务 | 端口 | 用途 |
|------|------|------|
| 前端 | 5173 | Vite 开发服务器 |
| 后端 | 8000 | FastAPI 服务 |
| API 文档 | 8000/docs | Swagger UI |

---

## 🔐 环境变量

**后端环境变量** (`backend/.env`):
- `DEBUG=true` - 开发模式
- `DATABASE_URL` - 数据库连接
- `DEEPSEEK_API_KEY` - AI 服务密钥

**前端环境变量** (`frontend/.env`):
- 无需额外配置，使用默认 Vite 设置

---

## 📝 开发建议

1. **启动顺序**：建议使用 `./dev-start.sh` 同时启动前后端
2. **日志监控**：开发时保持日志窗口打开以便查看错误
3. **定期检查**：使用 `./dev-status.sh` 检查服务健康状态
4. **关闭环境**：开发结束后运行 `./dev-stop.sh` 释放资源

---

## 🎯 下一步

启动成功后，你可以：
- 访问 http://localhost:5173 使用前端应用
- 访问 http://localhost:8000/docs 查看 API 文档
- 查看代码并开始开发

---

## 📖 更多文档

- [项目 README](README.md)
- [技术栈文档](TECH_STACK_DOCUMENTATION.md)
- [测试指南](INSIGHT_TESTING_GUIDE.md)

---

**最后更新：** 2026-01-23
