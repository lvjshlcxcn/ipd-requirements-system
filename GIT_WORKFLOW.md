# Git 版本控制工作流程指南

## 📋 分支策略

本项目采用 **Git Flow** 简化版分支策略：

```
main (生产环境)
  ↑
  └── develop (开发环境)
         ↑
         ├── feature/功能名称 (功能分支)
         ├── bugfix/问题描述 (修复分支)
         └── hotfix/紧急修复 (紧急修复分支)
```

---

## 🌳 分支说明

### 1. **main** 分支
- **用途**：生产环境稳定版本
- **保护**：只接受经过测试的代码
- **提交规则**：从 develop 合并，或紧急 hotfix
- **标签**：每次发布打 tag（v1.0.0, v1.1.0等）

### 2. **develop** 分支
- **用途**：开发集成分支
- **来源**：从 main 创建
- **合并**：接受 feature、bugfix 分支
- **推送**：功能完成后合并回 main

### 3. **feature/** 分支
- **命名**：`feature/功能描述` 或 `feature/ISSUE编号-功能描述`
- **来源**：从 develop 创建
- **合并**：开发完成后合并回 develop
- **删除**：合并后通常删除

**示例**：
```bash
git checkout develop
git checkout -b feature/需求导入功能
git checkout -b feature/ai辅助需求分析
```

### 4. **bugfix/** 分支
- **命名**：`bugfix/问题描述`
- **来源**：从 develop 创建
- **合并**：修复后合并回 develop

**示例**：
```bash
git checkout develop
git checkout -b bugfix/附件上传失败
git checkout -b bugfix/语音识别null问题
```

### 5. **hotfix/** 分支
- **命名**：`hotfix/紧急问题描述`
- **来源**：从 main 创建
- **合并**：修复后同时合并到 main 和 develop

**示例**：
```bash
git checkout main
git checkout -b hotfix/生产环境登录失效
```

---

## 🔄 日常开发工作流程

### 开发新功能

```bash
# 1. 确保在最新的 develop 分支
git checkout develop
git pull origin develop

# 2. 创建功能分支
git checkout -b feature/新功能名称

# 3. 开发代码...
# 修改文件、添加功能等

# 4. 提交代码（使用规范的提交信息）
git add .
git commit -m "feat: 添加需求导入Excel功能

- 支持Excel文件上传
- 自动解析需求字段
- 数据验证和错误提示"

# 5. 推送到远程（如果有远程仓库）
git push -u origin feature/新功能名称

# 6. 开发完成后合并回 develop
git checkout develop
git merge feature/新功能名称
git push origin develop

# 7. 删除功能分支（可选）
git branch -d feature/新功能名称
```

### 修复Bug

```bash
# 1. 创建 bugfix 分支
git checkout develop
git checkout -b bugfix/附件上传路径错误

# 2. 修复问题
# 修改代码...

# 3. 提交修复
git add .
git commit -m "fix: 修复附件上传API路径重复问题

- 移除 api.ts 中重复的 /api/v1 前缀
- 更新上传接口调用
- 测试通过"

# 4. 合并回 develop
git checkout develop
git merge bugfix/附件上传路径错误
git push origin develop
```

### 紧急修复（生产环境）

```bash
# 1. 从 main 创建 hotfix 分支
git checkout main
git checkout -b hotfix/生产环境数据库连接失败

# 2. 修复问题
# 修改代码...

# 3. 提交修复
git add .
git commit -m "hotfix: 修复生产环境数据库连接超时

- 增加连接池配置
- 调整超时时间
- 添加重试机制"

# 4. 合并回 main 和 develop
git checkout main
git merge hotfix/生产环境数据库连接失败
git push origin main

git checkout develop
git merge hotfix/生产环境数据库连接失败
git push origin develop
```

---

## 📝 提交信息规范

采用 **Conventional Commits** 规范：

### 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（不是新功能也不是修复）
- `test`: 添加测试
- `chore`: 构建/工具链更新

### 示例

```bash
# 简单提交
git commit -m "feat: 添加语音输入按钮"

# 详细提交
git commit -m "fix(api): 修复附件上传失败

问题：
- API路径重复导致404错误

解决方案：
- 移除 api.ts 中重复的 /api/v1 前缀
- 统一使用 Vite 代理配置

测试：附件上传功能恢复正常"

# 文档提交
git commit -m "docs: 更新API文档说明"

# 重构
git commit -m "refactor(components): 重构UploadAttachmentModal组件

- 提取公共逻辑到hooks
- 优化类型定义
- 改善错误处理"
```

---

## 🚨 紧急回滚

如果新功能导致系统崩溃：

### 方案一：回滚到上一个稳定版本

```bash
# 1. 查看提交历史
git log --oneline -10

# 2. 回滚到指定的提交（保留工作区修改）
git reset --soft <commit-hash>

# 3. 或者完全回滚（丢弃所有修改）
git reset --hard <commit-hash>

# 4. 如果已推送，强制推送（谨慎使用！）
git push origin main --force
```

### 方案二：创建 revert 提交（推荐）

```bash
# 1. 回滚某个提交（创建新提交）
git revert <commit-hash>

# 2. 推送
git push origin main
```

### 方案三：切换到旧版本（快速恢复）

```bash
# 1. 查看历史版本
git log --oneline --all

# 2. 创建临时分支查看旧版本
git checkout -b temp-restore <commit-hash>

# 3. 测试确认后，合并到 main
git checkout main
git merge temp-restore
git push origin main
```

---

## 🛡️ 安全预防措施

### 1. 开发前备份

```bash
# 每次开发前创建备份点
git tag backup-$(date +%Y%m%d-%H%M%S)
```

### 2. 频繁提交

```bash
# 小步提交，随时可以回滚
git commit -m "wip: 完成需求列表页面UI"
# 继续开发...
git commit -m "wip: 完成需求列表API调用"
# 继续开发...
git commit -m "feat: 完成需求列表功能"
```

### 3. 功能隔离

```bash
# 始终在功能分支上开发，不要直接在 main/develop 上改
git checkout -b feature/新功能
```

### 4. 推送前检查

```bash
# 查看即将提交的内容
git diff --cached

# 查看提交历史
git log --oneline -5

# 确认无误后再推送
git push
```

---

## 📊 常用Git命令速查

### 查看状态
```bash
git status                    # 查看当前状态
git log --oneline -10         # 查看最近10次提交
git branch -a                 # 查看所有分支
git diff                      # 查看未暂存的修改
git diff --staged             # 查看已暂存的修改
```

### 分支操作
```bash
git branch <分支名>           # 创建分支
git checkout <分支名>         # 切换分支
git checkout -b <分支名>      # 创建并切换分支
git branch -d <分支名>        # 删除分支
git merge <分支名>            # 合并分支
```

### 撤销操作
```bash
git restore <文件>            # 撤销工作区修改
git restore --staged <文件>   # 取消暂存
git reset --soft HEAD~1       # 撤销最后一次提交（保留修改）
git reset --hard HEAD~1       # 撤销最后一次提交（丢弃修改）
git revert <commit-hash>      # 创建新提交回滚指定提交
```

### 标签操作
```bash
git tag v1.0.0                # 创建标签
git tag -a v1.0.0 -m "版本1.0.0"  # 创建带注释的标签
git push origin v1.0.0        # 推送标签
git tag -d v1.0.0             # 删除本地标签
```

---

## 🎯 最佳实践

### ✅ 推荐做法

1. **使用分支隔离开发**
   - 新功能在 feature 分支开发
   - Bug修复在 bugfix 分支
   - 不要直接在 main/develop 上修改

2. **小步提交，频繁提交**
   - 每完成一个小功能就提交
   - 提交信息清晰描述修改内容
   - 不要积累大量修改一次性提交

3. **推送前测试**
   - 本地测试通过后再推送
   - 确认没有明显的问题

4. **使用标签标记重要版本**
   - 每次发布打 tag
   - 便于快速回滚到特定版本

### ❌ 避免做法

1. **不要直接在 main 分支开发**
   - main 应该始终是稳定版本
   - 所有开发在分支进行

2. **不要推送未测试的代码**
   - 可能导致系统崩溃
   - 影响其他人使用

3. **不要使用强制推送（--force）**
   - 会丢失历史记录
   - 除非确实需要

4. **不要提交敏感信息**
   - 密码、API密钥等
   - 使用 .gitignore 排除

---

## 📞 遇到问题？

### 查看帮助
```bash
git help <命令>     # 查看命令帮助
git <命令> --help   # 另一种查看帮助的方式
```

### 常见问题

**Q: 提交错误怎么办？**
```bash
# 修改最后一次提交信息
git commit --amend

# 取消最后一次提交（保留修改）
git reset --soft HEAD~1
```

**Q: 合并冲突怎么办？**
```bash
# 1. 查看冲突文件
git status

# 2. 手动解决冲突（编辑文件）

# 3. 标记冲突已解决
git add <冲突文件>

# 4. 完成合并
git commit
```

**Q: 搞混了怎么办？**
```bash
# 创建备份分支
git branch backup-$(date +%Y%m%d)

# 重新开始
git reset --hard HEAD
```

---

## 📅 版本历史

- **v1.0.0** (2026-01-20): 初始稳定版本
  - 完整的需求管理功能
  - APPEALS分析
  - RTM跟踪矩阵
  - AI助手集成

---

**最后更新**: 2026-01-20
**维护者**: IPD开发团队
**文档版本**: 1.0.0
