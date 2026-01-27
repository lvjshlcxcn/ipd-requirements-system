import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/e2e/', // 排除E2E测试
      ],
      // 设置覆盖率阈值
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
      perFile: false,
    },
    // 排除E2E测试文件和node_modules
    exclude: [
      'node_modules/',
      'dist',
      'src/e2e/',
      '**/*.spec.ts', // Playwright测试文件
      '**/node_modules/**',
    ],
    // 只包含src目录下的测试
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
    ],
  },
})
