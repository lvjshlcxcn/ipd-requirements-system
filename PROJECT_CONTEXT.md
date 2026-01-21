# IPD 需求管理系统 - 项目上下文文档

## 📋 项目基本信息

**项目名称**：IPD Requirements Management System (IPD需求管理系统)

**项目位置**：`/Users/kingsun/claude_study/`

**开发环境**：
- 操作系统：macOS (M4 处理器)
- 开发机器：kingsun's Mac

**快速启动命令**：
```bash
cd /Users/kingsun/claude_study
./req-start.sh  # 启动前后端服务
./req-stop.sh   # 停止服务
./req-status.sh # 查看服务状态
```

**访问地址**：
- 前端应用：http://localhost:5173
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

**默认登录**：
- 用户名：`admin`
- 密码：`admin123`

---

## 🛠️ 技术栈

### 前端
- **框架**：React 18 + TypeScript
- **构建工具**：Vite 5.4.21
- **UI框架**：Ant Design 5.x
- **路由**：React Router v6
- **状态管理**：React Hooks (useState, useEffect)
- **图表**：Recharts
- **位置**：`/Users/kingsun/claude_study/frontend/`

### 后端
- **框架**：FastAPI (Python 3.13)
- **数据库**：PostgreSQL
- **ORM**：SQLAlchemy
- **数据库名**：`ipd_req_db`
- **用户**：`ipd_user`
- **位置**：`/Users/kingsun/claude_study/backend/`

---

## 📁 项目结构

```
claude_study/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── components/         # 公共组件
│   │   │   ├── requirements/
│   │   │   │   └── UploadAttachmentModal.tsx
│   │   │   ├── VoiceInputTextArea.tsx  # 语音输入组件
│   │   │   └── AIIcons.tsx           # AI图标组件
│   │   ├── pages/              # 页面组件
│   │   │   ├── requirements/  # 需求管理页面
│   │   │   ├── dashboard/     # 仪表盘
│   │   │   ├── analysis/      # 需求分析
│   │   │   ├── rtm/           # 需求跟踪
│   │   │   └── verifications/ # 需求验证
│   │   ├── services/          # API服务
│   │   │   ├── api.ts
│   │   │   └── requirement.service.ts
│   │   └── App.tsx            # 主应用组件（包含路由和页面）
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # 后端项目
│   ├── app/
│   │   ├── api/               # API路由
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── requirements.py
│   │   │       ├── appeals.py
│   │   │       ├── attachments.py
│   │   │       ├── rtm.py
│   │   │       └── ...
│   │   ├── core/              # 核心功能
│   │   ├── db/                # 数据库
│   │   ├── models/            # 数据模型
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # 业务逻辑
│   │   └── main.py            # FastAPI应用入口
│   ├── venv/                  # Python虚拟环境
│   └── requirements.txt
│
├── req-start.sh               # 启动脚本
├── req-stop.sh                # 停止脚本
├── req-status.sh              # 状态检查脚本
├── 启动说明.md
└── README.md
```

---

## ✨ 已实现的核心功能

### 1. 需求管理
- ✅ 需求CRUD操作
- ✅ 需求列表（分页、筛选、搜索）
- ✅ 需求详情查看
- ✅ 需求编辑
- ✅ 需求删除
- ✅ **附件上传功能**（已修复上传路径问题）
- ✅ **语音输入功能**（需求10问支持语音输入）

### 2. 需求分析 (APPEALS)
- ✅ $APPEALS 八维度分析
- ✅ 动态权重调整
- ✅ 雷达图可视化
- ✅ 加权总分计算

### 3. 需求分发
- ✅ 待分发需求列表
- ✅ 分发到系统计划(SP)、商业计划(BP)、项目章程、PCR
- ✅ 自动生成目标ID
- ✅ 取消分发功能

### 4. 需求跟踪矩阵 (RTM)
- ✅ 需求追溯管理
- ✅ 追溯统计
- ✅ 设计、代码、测试用例关联

### 5. 仪表盘
- ✅ 需求统计概览
- ✅ 状态分布
- ✅ 来源分布
- ✅ RTM统计（追溯完成率）

### 6. 需求洞察分析
- ✅ **文本洞察分析**（基于DeepSeek AI）
- ✅ **IPD需求十问自动提取**
- ✅ **用户故事卡片生成**
- ✅ **快速分析模式**（10-20秒，核心要点提取）
- ✅ **深度分析模式**（30-60秒，完整IPD十问）
- ✅ **智能文本处理**（支持最长20000字）
- ✅ **用户画像分析**（角色、部门、痛点、目标）
- ✅ **场景分析**（背景、环境、触发条件）
- ✅ **情感标签**（紧急度、重要性、情感倾向）
- ✅ **可视化用户故事板**
- ✅ **需求关联功能**（洞察结果可关联到需求）

---

## 🎨 UI/UX 特色功能

### 1. 菜单收缩功能
- 位置：MainLayout组件
- 功能：点击左上角菜单按钮(☰)可收缩/展开左侧菜单
- 收缩后只显示图标，宽度从240px变为80px

### 2. AI助手快捷入口
- 位置：页面右上角Header
- **DeepSeek按钮**：紫色渐变圆形图标，点击打开 https://chat.deepseek.com/
- **Claude按钮**：橙色渐变方形图标，点击打开 https://claude.ai/
- 使用自定义SVG图标组件

### 3. 语音输入
- 位置：需求10问表单的每个输入框
- 组件：`VoiceInputTextArea`
- 功能：点击"语音"按钮开始语音识别，点击"停止"结束
- 支持中文语音识别（浏览器Web Speech API）

---

## 🔧 关键配置文件

### 前端配置
**API Base URL**：`/api/v1` (默认通过Vite代理到后端8000端口)

**关键文件**：
- `/Users/kingsun/claude_study/frontend/src/App.tsx` - 主应用组件（所有页面都在这一个文件中）
- `/Users/kingsun/claude_study/frontend/src/services/api.ts` - API客户端配置
- `/Users/kingsun/claude_study/frontend/src/services/requirement.service.ts` - 需求相关API

### 后端配置
**数据库连接**：`postgresql://ipd_user:ipd_pass@localhost:5432/ipd_req_db`

**API前缀**：`/api/v1`

**关键文件**：
- `/Users/kingsun/claude_study/backend/app/main.py` - FastAPI应用入口
- `/Users/kingsun/claude_study/backend/app/db/session.py` - 数据库会话

---

## 🐛 已修复的问题

1. ✅ **附件上传失败**：修复了API路径重复 `/api/v1/api/v1/...` 的问题
2. ✅ **语音输入null问题**：修复了语音识别时出现"null"文本的问题
3. ✅ **Modal警告**：将`destroyOnClose`改为`destroyOnHidden`
4. ✅ **附件按钮不显示**：修改了正确的App.tsx文件中的requirementColumns

---

## 📊 当前运行状态

**服务进程**：
- 前端：通过 `npm run dev` 运行在 Vite 开发服务器（端口5173）
- 后端：通过 `uvicorn app.main:app --reload` 运行（端口8000）

**日志位置**：
- 前端日志：`/tmp/ipd_frontend.log`
- 后端日志：`/tmp/ipd_backend.log`

**查看日志**：
```bash
tail -f /tmp/ipd_frontend.log  # 前端
tail -f /tmp/ipd_backend.log   # 后端
```

---

## 🚀 快速开发命令

```bash
# 进入前端目录
cd /Users/kingsun/claude_study/frontend

# 安装依赖（如果需要）
npm install

# 启动前端开发服务器
npm run dev

# 进入后端目录
cd /Users/kingsun/claude_study/backend

# 激活虚拟环境
source venv/bin/activate

# 安装依赖（如果需要）
pip install -r requirements.txt

# 启动后端服务器
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 💡 重要注意事项

### 前端开发
1. **热更新**：Vite支持热模块替换(HMR)，修改代码后自动刷新
2. **路由**：所有路由都在`App.tsx`中定义
3. **菜单配置**：menuItems数组在App.tsx中定义（第51-58行）
4. **布局组件**：MainLayout提供侧边栏菜单和Header

### 后端开发
1. **热重载**：uvicorn使用--reload参数，修改代码后自动重启
2. **API文档**：访问 http://localhost:8000/docs 查看交互式API文档
3. **数据库迁移**：使用Alembic管理数据库迁移
4. **多租户**：系统支持多租户，默认租户ID为1

### 已知问题
- ⚠️ Input组件的`addonAfter`警告（可忽略，不影响功能）
- ℹ️ appeals 404错误（正常行为，表示该需求还未进行APPEALS分析）

---

## 📝 下次继续开发时的快速恢复步骤

1. **检查服务状态**：
   ```bash
   cd /Users/kingsun/claude_study
   ./req-status.sh
   ```

2. **如果服务未运行，启动服务**：
   ```bash
   ./req-start.sh
   ```

3. **访问应用**：打开浏览器访问 http://localhost:5173

4. **查看日志**（如果有问题）：
   ```bash
   tail -f /tmp/ipd_frontend.log
   tail -f /tmp/ipd_backend.log
   ```

---

## 🎯 项目特点总结

1. **单体文件架构**：前端所有页面组件都在`App.tsx`一个文件中（便于快速开发和修改）
2. **全栈开发**：React + FastAPI + PostgreSQL
3. **现代化UI**：使用Ant Design 5.x组件库
4. **IPD方法论**：集成需求管理、APPEALS分析、追溯矩阵等功能
5. **AI辅助**：内置DeepSeek和Claude快捷入口
6. **语音输入**：支持语音识别填写需求

---

**最后更新**：2026-01-19
**文档维护者**：Claude Code Assistant
**项目状态**：✅ 正在开发中，功能完善阶段

---

💡 **提示**：下次打开Claude Code时，直接说"继续开发IPD需求管理系统"，并引用此文档的路径即可快速恢复上下文！
