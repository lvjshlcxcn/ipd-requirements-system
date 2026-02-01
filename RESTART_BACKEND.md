# 重启后端服务指南

## 方法1: 如果后端在终端中运行

在后端运行的终端中：
- 按 `Ctrl + C` 停止服务
- 然后重新运行：
  ```bash
  cd backend
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```

## 方法2: 自动重启（推荐）

如果使用了 `--reload` 参数启动，修改应该会自动生效。

检查终端输出，应该看到：
```
Reloading...
Application startup complete.
```

## 方法3: 手动重启

如果自动重载不工作：
```bash
# 找到并停止后端进程
kill 10946

# 重新启动
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 验证修复

重启后，刷新浏览器页面，错误应该消失：
- ❌ 之前：`422 (Unprocessable Content)` - path -> checklist_id error
- ✅ 现在：`200 OK` - summary 数据正常返回

然后再次尝试编辑并保存验证清单。
