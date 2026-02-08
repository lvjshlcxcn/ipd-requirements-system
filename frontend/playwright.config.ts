import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 *
 * 测试框架: Playwright
 * 测试目录: e2e/
 * 基础URL: http://localhost:5173 (Vite dev server)
 *
 * 运行测试:
 * - npx playwright test                    # 运行所有测试
 * - npx playwright test review-meeting     # 运行特定测试
 * - npx playwright show-report             # 查看测试报告
 */
export default defineConfig({
  testDir: './e2e',

  // E2E 测试通常需要顺序执行（避免数据冲突）
  fullyParallel: false,

  // CI 环境下禁止 only 测试
  forbidOnly: !!process.env.CI,

  // 失败重试次数
  retries: process.env.CI ? 2 : 0,

  // 单个工作进程（避免并发导致的数据冲突）
  workers: 1,

  // HTML 报告
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list', { printSteps: true }],
  ],

  // 全局测试配置
  use: {
    // 基础 URL（指向 Vite 开发服务器）
    baseURL: 'http://localhost:5173',

    // 失败时截图
    screenshot: 'only-on-failure',

    // 失败时录制视频
    video: 'retain-on-failure',

    // 失败时保存 trace
    trace: 'on-first-retry',

    // 操作超时时间（毫秒）
    actionTimeout: 10000,

    // 导航超时时间
    navigationTimeout: 30000,

    // 等待超时时间
    timeout: 60000,
  },

  // 测试项目配置
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 视口大小
        viewport: { width: 1280, height: 720 },
        // 忽略 HTTPS 错误（如果是本地开发）
        ignoreHTTPSErrors: true,
      },
    },
  ],

  // 开发服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    port: 5173,
    // 重用已有的服务器（避免频繁重启）
    reuseExistingServer: !process.env.CI,
    // 启动超时
    timeout: 120000,
  },

  // 全局设置
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
});
