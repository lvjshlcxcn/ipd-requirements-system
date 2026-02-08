# 数据库列缺失问题修复指南

## 问题描述

```
[Error] Failed to load resource: the server responded with a status of 500
 UndefinedColumn: column requirement_review_meeting_requirements.assigned_voter_ids does not exist
```

**原因：** 模型中定义了 `assigned_voter_ids` 字段，但数据库表中没有这个列。

---

## ✅ 解决方案（选择其中一个）

### 方案 1：使用临时迁移 API（推荐，最简单）

1. **确保后端正在运行**

2. **打开浏览器访问以下 URL：**
   ```
   http://localhost:8000/docs
   ```

3. **在 Swagger UI 中找到：**
   - 展开 `/api/v1/migration/add-assigned-voter-ids-column`
   - 点击 "Try it out"
   - 点击 "Execute"

4. **验证响应：**
   ```json
   {
     "success": true,
     "message": "成功添加 assigned_voter_ids 列",
     "column_info": [
       {"name": "assigned_voter_ids", "type": "jsonb"}
     ]
   }
   ```

5. **刷新前端页面**

---

### 方案 2：手动执行 SQL（如果方案 1 不可用）

#### 使用 Docker Compose

```bash
# 进入 PostgreSQL 容器
docker-compose exec postgres psql -U postgres -d ipd_db

# 执行 SQL
ALTER TABLE requirement_review_meeting_requirements
ADD COLUMN IF NOT EXISTS assigned_voter_ids JSONB;

# 验证
\d requirement_review_meeting_requirements

# 退出
\q
```

#### 使用 psql 命令行

```bash
psql -U postgres -d ipd_db -c "
ALTER TABLE requirement_review_meeting_requirements
ADD COLUMN IF NOT EXISTS assigned_voter_ids JSONB;
"
```

#### 使用 pgAdmin 或其他 GUI 工具

1. 连接到数据库
2. 执行以下 SQL：
   ```sql
   ALTER TABLE requirement_review_meeting_requirements
   ADD COLUMN IF NOT EXISTS assigned_voter_ids JSONB;
   ```
3. 点击"执行"或"Run"

---

### 方案 3：使用 Python 脚本（如果数据库在本地）

```bash
cd backend
python3 add_column_migration.py
```

---

## 🔍 验证修复

### 1. 检查列是否添加成功

在数据库中执行：
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'requirement_review_meeting_requirements'
AND column_name = 'assigned_voter_ids';
```

**期望结果：**
```
     column_name      | data_type
----------------------+----------
 assigned_voter_ids   | jsonb
```

### 2. 测试前端

1. 刷新前端页面（Ctrl+Shift+R）
2. 进入评审中心
3. 选择一个会议

**期望结果：** 不再出现 500 错误，需求列表正常显示

---

## 🛠️ 故障排查

### 如果迁移 API 返回 404

**原因：** 后端服务器没有加载新的 `migration.py` 路由

**解决方法：**
1. 重启后端服务器
2. 确保 `main.py` 中包含了 `migration` 路由的注册

### 如果 API 返回 500

**检查后端日志：**
```bash
# 查看后端终端输出
# 或检查日志文件
tail -f backend/logs/app.log
```

### 如果 SQL 执行失败

**可能原因：**
1. 数据库连接失败
2. 权限不足
3. 表名或列名冲突

**解决方法：**
1. 确认数据库连接配置正确（`.env` 文件中的 `DATABASE_URL`）
2. 确认用户有 ALTER TABLE 权限
3. 使用 `IF NOT EXISTS` 避免列已存在的错误

---

## 📝 预防措施

### 使用 Alembic 迁移（生产环境推荐）

**创建迁移文件：**
```bash
cd backend
alembic revision --autogenerate -m "add assigned_voter_ids"
```

**执行迁移：**
```bash
alembic upgrade head
```

### 在 CI/CD 中自动执行迁移

在部署脚本中添加：
```bash
# 自动执行所有未执行的迁移
alembic upgrade head
```

---

## 🎯 快速修复总结

**最简单的方法（3步）：**

1. 打开 `http://localhost:8000/docs`
2. 执行 `/api/v1/migration/add-assigned-voter-ids-column`
3. 刷新前端页面

**完成时间：** < 1 分钟

---

## 📚 相关文档

- [Alembic 官方文档](https://alembic.sqlalchemy.org/)
- [PostgreSQL ALTER TABLE 文档](https://www.postgresql.org/docs/current/sql-altertable.html)
- [投票统计修复](./vote-statistics-fix.md)
- [CORS 错误修复](./vote-cors-fix.md)
