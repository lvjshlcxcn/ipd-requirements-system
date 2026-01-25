import { test, expect } from '@playwright/test'

test.describe('屏幕锁定功能 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('http://localhost:5173/login')
    await page.fill('input[placeholder*="用户名"], input[name="username"]', 'testuser')
    await page.fill('input[placeholder*="密码"], input[name="password"]', 'testpass123')
    await page.click('button[type="submit"]')

    await page.waitForURL('http://localhost:5173/')
    await page.waitForLoadState('networkidle')
  })

  test('应该能够通过密码解锁', async ({ page }) => {
    // 设置锁定状态
    await page.evaluate(() => {
      localStorage.setItem('app_screen_locked', 'true')
      localStorage.setItem('app_locked_username', 'testuser')
      window.location.reload()
    })

    await page.waitForLoadState('networkidle')

    await page.fill('input[placeholder*="请输入密码"]', 'testpass123')
    await page.click('button:has-text("解锁")')

    await page.waitForTimeout(1000)
    await expect(page.locator('text=/欢迎回来/')).not.toBeVisible()
  })

  test('锁定期间刷新页面应该保持锁定', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('app_screen_locked', 'true')
      localStorage.setItem('app_locked_username', 'testuser')
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=/欢迎回来，testuser/')).toBeVisible()
  })
})
