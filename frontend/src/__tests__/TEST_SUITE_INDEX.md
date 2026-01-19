# 前端测试套件

## 测试文件索引

### 组件测试

#### ChecklistItemView.test.tsx
**路径**: `src/__tests__/components/ChecklistItemView.test.tsx`

测试 ChecklistItem 组件的：
- ✅ 正确渲染
- ✅ 选中状态显示
- ✅ 备注显示
- ✅ 只读模式
- ✅ 用户交互（点击、输入）
- ✅ 禁用状态
- ✅ 边界情况

#### 示例测试

```tsx
describe('ChecklistItemView', () => {
  it('should render correctly')
  it('should display checked state')
  it('should display notes')
  it('should call onToggle when clicked')
  it('should call onNotesChange when typing')
  it('should be disabled when disabled prop is true')
  it('should not show textarea in readOnly mode')
})
```

### Store 测试

#### useAuthStore.test.ts
**路径**: `src/__tests__/stores/useAuthStore.test.ts`

测试认证 store：
- ✅ 初始状态
- ✅ 登录成功
- ✅ 登录失败
- ✅ 登出
- ✅ 用户状态持久化

#### 示例测试

```tsx
describe('useAuthStore', () => {
  it('should have correct initial state')
  it('should login successfully with valid credentials')
  it('should handle login failure')
  it('should clear user data on logout')
  it('should persist user data')
})
```

## 测试覆盖矩阵

| 模块 | 组件/Store | 测试数量 | 状态 |
|------|------------|---------|------|
| 验证 | ChecklistItemView | 7 | ✅ |
| 验证 | VerificationSummary | - | 📝 待添加 |
| 验证 | ChecklistForm | - | 📝 待添加 |
| 分析 | MoSCoWPrioritizer | - | 📝 待添加 |
| 分析 | INVESTScore | - | 📝 待添加 |
| 分析 | RICEScore | - | 📝 待添加 |
| 布局 | MainLayout | - | 📝 待添加 |
| 导入导出 | ImportModal | - | 📝 待添加 |
| 导入导出 | ExportModal | - | 📝 待添加 |
| Stores | useAuthStore | 5 | ✅ |
| Stores | useRequirementStore | - | 📝 待添加 |
| Stores | useAnalysisStore | - | 📝 待添加 |
| Stores | useVerificationStore | - | 📝 待添加 |
| Stores | useNotificationStore | - | 📝 待添加 |

## 测试场景清单

### 用户认证流程

- [ ] 用户登录
  - [ ] 成功登录
  - [ ] 用户名不存在
  - [ ] 密码错误
  - [ ] 空字段验证
  - [ ] 表单验证
- [ ] 用户登出
  - [ ] 清除本地状态
  - [ ] API 调用
- [ ] 用户注册
  - [ ] 成功注册
  - [ ] 邮箱已存在
  - [ ] 表单验证

### 需求管理

- [ ] 需求列表
  - [ ] 显示需求列表
  - [ ] 分页
  - [ ] 搜索
  - [ ] 筛选
  - [ ] 排序
- [ ] 创建需求
  - [ ] 打开表单
  - [ ] 填写字段
  - [ ] 提交
  - [ ] 验证
- [ ] 编辑需求
  - [ ] 加载现有数据
  - [ ] 更新字段
  - [ ] 保存
- [ ] 删除需求
  - [ ] 确认对话框
  - [ ] API 调用
  - [ ] 列表更新

### APPEALS 分析

- [ ] APPEALS 表单
  - [ ] 8 个维度输入
  - [ ] 分数验证（1-10）
  - [ ] 权重验证（0.0-1.0）
  - [ ] 自动计算总分
- [ ] 雷达图显示
  - [ ] 数据可视化
  - [ ] 交互
  - [ ] 响应式

### 需求跟踪 (RTM)

- [ ] 跟踪矩阵
  - [ ] 显示关联关系
  - [ ] 过滤
  - [ ] 导出
- [ ] 验证检查清单
  - [ ] 添加检查项
  - [ ] 标记完成
  - [ ] 添加备注
  - [ ] 进度统计

## 性能测试场景

- [ ] 大列表渲染（100+ 项）
- [ ] 大数据集搜索
- [ ] 复杂表单性能
- [ ] 图表渲染性能

## 可访问性测试

- [ ] 键盘导航
- [ ] ARIA 标签
- [ ] 屏幕阅读器支持
- [ ] 颜色对比度
- [ ] 焦点管理

## 测试数据管理

### Mock 数据文件

- `data.ts` - 通用测试数据
  - 用户数据
  - 需求数据
  - APPEALS 数据
  - 统计数据

### 策略

1. **真实数据结构** - Mock 数据应匹配 API 响应
2. **边界情况** - 包含空数据、大数据等
3. **可复用** - 在多个测试中复用 mock 数据
4. **版本管理** - 与 API 更新同步

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
        
      - name: Run tests
        run: npm test
        working-directory: ./frontend
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./frontend/coverage
```

## 下一步

1. 为核心组件添加测试
2. 为页面组件添加集成测试
3. 添加 E2E 测试（Playwright）
4. 设置性能基准测试
5. 集成到 CI/CD

---

**状态**: ✅ 测试框架完成 | 📝 测试用例编写中 | 🚀 准备投入生产
