import { FullConfig } from '@playwright/test';

/**
 * E2E 测试全局设置
 *
 * 在所有测试运行前执行一次：
 * - 设置测试环境变量
 * - 准备测试数据库（可选）
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');

  // 设置环境变量
  process.env.NODE_ENV = 'test';

  // 可以在这里准备测试数据库
  // 例如：运行数据库迁移、种子数据等

  console.log('✅ E2E test setup complete');
}

export default globalSetup;
