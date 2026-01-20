# App.tsx 重构设计方案

**设计日期**: 2026-01-20
**设计目标**: 将 2012 行的 App.tsx 重构为模块化架构
**重构策略**: 按功能模块拆分

## 目录结构

```
frontend/src/
├── App.tsx                    # 应用入口(简化到 ~20 行)
├── features/                  # 功能模块
│   ├── auth/                 # 认证模块
│   ├── dashboard/            # 仪表盘模块
│   ├── requirements/         # 需求管理模块
│   ├── analytics/            # 需求分析模块
│   ├── distribution/         # 需求分发模块
│   ├── rtm/                  # 需求跟踪模块
│   └── verifications/        # 需求验证模块
├── shared/                    # 共享代码
│   ├── components/
│   │   ├── layout/           # 布局组件
│   │   └── common/           # 通用组件
│   ├── constants/            # 常量定义
│   ├── hooks/                # 自定义 Hooks
│   ├── utils/                # 工具函数
│   └── types/                # 类型定义
├── router/                    # 路由配置
│   ├── index.tsx
│   └── routes.ts
└── services/                  # API 服务
```

## 模块划分

### 1. auth 模块
- **职责**: 用户认证和登录
- **页面**: LoginPage
- **依赖**: localStorage, auth API

### 2. dashboard 模块
- **职责**: 数据统计和概览展示
- **页面**: DashboardPage
- **依赖**: requirements API, rtm API

### 3. requirements 模块
- **职责**: 需求的 CRUD 管理
- **页面**: RequirementsListPage, RequirementEditPage
- **核心功能**:
  - 需求列表展示
  - 需求创建/编辑
  - 需求10问表单
  - 附件上传
  - MoSCoW 优先级管理

### 4. analytics 模块
- **职责**: $APPEALS 八维度需求分析
- **页面**: AnalyticsPage
- **核心功能**:
  - APPEALS 评分表单
  - 动态权重调整
  - 雷达图可视化

### 5. distribution 模块
- **职责**: 需求分发到 SP/BP/Charter/PCR
- **页面**: DistributionPage
- **核心功能**:
  - 待分发需求列表
  - 目标ID自动生成
  - 批量分发操作

### 6. rtm 模块
- **职责**: 需求跟踪矩阵(已独立)
- **页面**: RTMPage

### 7. verifications 模块
- **职责**: 需求验证清单管理(已独立)
- **页面**: 三个验证相关页面

## 共享代码组织

### shared/constants/
- `menuItems.ts`: 菜单配置
- `statusMaps.ts`: 状态映射(来源、状态、MoSCoW、优先级)

### shared/components/layout/
- `MainLayout.tsx`: 主布局(侧边栏、Header)
- `ProtectedRoute.tsx`: 路由权限控制

### shared/components/common/
- `VoiceInputTextArea.tsx`: 语音输入组件
- `UploadAttachmentModal.tsx`: 附件上传组件
- `AIIcons.tsx`: AI 图标组件

### shared/utils/
- `formatters.ts`: 格式化函数(日期、状态渲染等)

### shared/types/
- `common.ts`: 通用类型(用户、分页等)
- `api.ts`: API 响应类型
- `router.ts`: 路由类型

## 路由配置

### router/routes.ts
- 集中管理所有路由配置
- 支持懒加载
- 与菜单配置同步

### router/index.tsx
- 递归渲染路由
- 统一 Loading 处理
- 权限控制集成

### App.tsx (简化后)
```tsx
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AppRouter } from '@/router'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AppRouter />
    </ConfigProvider>
  )
}

export default App
```

## 类型管理策略

### 分层原则
- `shared/types/`: 跨模块共享类型
- `features/*/types.ts`: 模块特定类型
- 使用 `export *` 统一导出

### 类型分类
- **通用类型**: User, LoginResponse, Pagination
- **API 类型**: Requirement, AppealsAnalysis, Stats
- **模块类型**: 各模块特定的表单、数据类型

## 重构优势

✅ **可维护性**: 每个模块职责清晰,代码行数大幅减少
✅ **团队协作**: 多人可并行开发不同模块
✅ **代码组织**: 清晰的目录结构,易于导航
✅ **功能扩展**: 新增功能只需添加新 feature
✅ **性能优化**: 路由懒加载,减少初始包体积
✅ **类型安全**: 完整的 TypeScript 类型定义

## 实施建议

1. **创建新目录结构**: 先创建所有目录和空文件
2. **迁移共享代码**: 先迁移 constants, components, utils
3. **拆分页面组件**: 按模块顺序拆分页面
4. **配置路由**: 建立新的路由系统
5. **测试验证**: 逐个模块测试功能
6. **清理代码**: 删除旧的 App.tsx

## 注意事项

- 保持现有功能完全一致
- 不引入破坏性变更
- 逐步迁移,确保每步可运行
- 保留 commit 历史,便于回滚
