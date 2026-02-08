import { FullConfig } from '@playwright/test';

/**
 * E2E 测试全局清理
 *
 * 在所有测试运行后执行一次：
 * - 清理测试数据
 * - 关闭测试数据库连接（可选）
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...');

  // 可以在这里清理测试数据
  // 例如：删除测试数据库、清理临时文件等

  console.log('✅ E2E test teardown complete');
}

export default globalTeardown;
