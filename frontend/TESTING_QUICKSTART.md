# 前端测试快速开始指南

## 前置条件

确保已安装 Node.js 18+ 和 npm。

## 安装依赖

```bash
cd frontend
npm install
```

这将安装所有必要的测试依赖：

- `vitest` - 测试框架
- `@testing-library/react` - React 组件测试
- `@testing-library/jest-dom` - 额外的断言方法
- `@testing-library/user-event` - 用户交互模拟
- `jsdom` - DOM 环境
- `@vitest/coverage-v8` - 代码覆盖率
- `@vitest/ui` - 可视化测试界面

## 验证安装

运行以下命令验证安装：

```bash
# 检查 vitest 版本
npx vitest --version

# 查看测试帮助
npm test -- --help
```

## 运行测试

### 1. 运行所有测试

```bash
npm test
```

### 2. 监听模式（推荐用于开发）

```bash
npm run test:watch
```

测试将在文件变化时自动重新运行。

### 3. UI 模式

```bash
npm run test:ui
```

在浏览器中打开可视化测试界面：

```
http://localhost:51204/__vitest__/
```

### 4. 覆盖率报告

```bash
npm run test:coverage
```

生成 HTML 覆盖率报告：

```bash
open coverage/index.html
```

## 运行特定测试

### 运行单个测试文件

```bash
npm test -- ChecklistItemView.test.tsx
```

### 运行匹配模式的测试

```bash
# 运行所有组件测试
npm test -- components

# 运行所有 store 测试
npm test -- stores
```

### 调试模式

```bash
npm test -- --inspect-brk --no-coverage
```

## 测试结构

```
src/
├── __tests__/               # 测试文件
│   ├── components/          # 组件测试
│   │   └── *.test.tsx
│   ├── pages/              # 页面测试
│   │   └── *.test.tsx
│   └── stores/             # Store 测试
│       └── *.test.ts
├── test/                   # 测试基础设施
│   ├── setup.ts           # 全局测试设置
│   ├── mocks/             # Mock 数据
│   │   ├── data.ts        # 测试数据
│   │   └── api.ts         # API mocks
│   └── utils/             # 测试工具
│       └── render.tsx     # 自定义 render
```

## 编写测试

### 组件测试模板

```tsx
import { render, screen } from '@/test/utils/render'
import { expect } from 'vitest'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Store 测试模板

```tsx
import { renderHook, act } from '@testing-library/react'
import { useMyStore } from '@/stores/useMyStore'

describe('useMyStore', () => {
  it('should update state correctly', async () => {
    const { result } = renderHook(() => useMyStore())
    
    await act(async () => {
      await result.current.someAction()
    })
    
    expect(result.current.someValue).toBe('expected')
  })
})
```

## 常见问题

### Q: 测试失败并显示 "Cannot find module '@/xxx'"

**A**: 确保 `vitest.config.ts` 中的路径别名配置正确：

```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Q: TypeScript 错误 "Cannot find name 'describe'"

**A**: 确保 `src/test/setup.ts` 被正确引用，或者添加 `// @ts-check` 在文件顶部。

### Q: Ant Design 组件测试警告

**A**: 某些 Ant Design 组件在测试中可能会警告。这些通常可以忽略，或者使用 `@testing-library/dom` 的 `configure` 来过滤。

### Q: 测试超时

**A**: 在 `vitest.config.ts` 中增加超时时间：

```ts
test: {
  testTimeout: 10000,
}
```

## 下一步

1. ✅ 安装依赖完成
2. ✅ 运行测试验证
3. 📝 为现有组件添加测试
4. 📝 添加页面级测试
5. 📝 设置 CI/CD 测试管道

## 参考资源

- [Vitest 文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/react)
- [Ant Design 测试指南](https://ant.design/docs/react/testing)
- [Jest DOM 文档](https://github.com/testing-library/jest-dom)
