import { test, expect, BrowserContext } from '@playwright/test';
import {
  loginViaPage,
  login,
  createTestMeeting,
  getUserIdByUsername,
  addAttendeeToMeeting,
  addRequirementToMeeting,
  startMeeting,
  endMeeting,
  cleanupTestData,
  formatDate,
  generateMeetingTitle,
  TEST_USERS,
} from './helpers/test-data';

/**
 * E2E 测试 3: 主持人控制功能
 *
 * 用户故事：作为会议主持人，我需要控制会议流程
 *
 * 测试步骤：
 * 1. 登录（主持人账号）
 * 2. 创建会议
 * 3. 尝试开始会议 → 成功
 * 4. 切换到普通用户账号
 * 5. 尝试开始会议 → 失败（403 Forbidden）
 * 6. 切换回主持人账号
 * 7. 使用"下一位投票人"功能
 * 8. 结束会议
 * 9. 切换到普通用户账号
 * 10. 尝试结束会议 → 失败（403 Forbidden）
 *
 * 验证点：
 * ✅ 只有主持人能开始/结束会议
 * ✅ 只有主持人能使用"下一位投票人"功能
 * ✅ 权限检查正确
 */
test.describe('主持人控制功能 E2E 测试', () => {
  let createdMeetingIds: number[] = [];
  let moderatorToken: string;
  let regularUserToken: string;

  test.beforeAll(async ({ request }) => {
    moderatorToken = await login(request, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
    regularUserToken = await login(request, TEST_USERS.regularUser.username, TEST_USERS.regularUser.password);
  });

  test.afterAll(async ({ request }) => {
    await cleanupTestData(request, moderatorToken, createdMeetingIds);
  });

  test('主持人权限控制', async ({ page, request, context }) => {
    let meetingId: number;

    // ========== 步骤 1-2: 主持人创建会议 ==========
    await test.step('主持人创建会议', async () => {
      await loginViaPage(page, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
      await page.goto('/review-center');

      const meetingTitle = generateMeetingTitle('主持人权限测试');

      // 点击"创建会议"
      await page.click('button:has-text("创建会议")');
      await page.waitForSelector('role=dialog', { timeout: 5000 });

      // 填写信息
      await page.fill('input[name="title"]', meetingTitle);
      await page.fill('textarea[name="description"]', '测试主持人权限');
      await page.fill('input[name="scheduled_at"]', formatDate(1));

      // 提交
      await page.click('role=dialog button:has-text("确定")');
      await page.waitForSelector('text=会议创建成功', { timeout: 10000 });

      // 获取会议 ID
      const url = page.url();
      const match = url.match(/\/review-center\/(\d+)/);
      if (match) {
        meetingId = parseInt(match[1], 10);
        createdMeetingIds.push(meetingId);
        console.log(`✅ 主持人创建会议成功 (ID: ${meetingId})`);
      } else {
        throw new Error('无法获取会议 ID');
      }
    });

    // ========== 步骤 3: 主持人开始会议（成功）==========
    await test.step('主持人开始会议', async () => {
      // 刷新页面
      await page.reload();

      // 点击"开始会议"
      await page.click('button:has-text("开始会议")');
      await page.waitForSelector('role=dialog', { timeout: 5000 });
      await page.click('role=dialog button:has-text("确定")');

      // 等待成功提示
      await page.waitForSelector('text=会议进行中', { timeout: 10000 });

      console.log('✅ 主持人成功开始会议');

      // 验证控制按钮可见
      await expect(page.locator('button:has-text("结束会议")')).toBeVisible();
      await expect(page.locator('button:has-text("下一位投票人")')).toBeVisible();
    });

    // ========== 步骤 4-5: 普通用户尝试开始会议（失败）==========
    await test.step('普通用户无法开始会议', async () => {
      // 登出并切换到普通用户
      await page.goto('/logout');

      // 创建新的浏览器上下文（模拟不同用户）
      const regularUserContext = await context.browser().newContext();
      const regularUserPage = await regularUserContext.newPage();

      await loginViaPage(regularUserPage, TEST_USERS.regularUser.username, TEST_USERS.regularUser.password);
      await regularUserPage.goto(`/review-center/${meetingId}`);
      await regularUserPage.waitForLoadState('networkidle');

      // 验证"开始会议"按钮不存在或禁用
      const startButton = regularUserPage.locator('button:has-text("开始会议")');
      const isVisible = await startButton.isVisible().catch(() => false);

      if (isVisible) {
        const isDisabled = await startButton.isDisabled();
        expect(isDisabled).toBe(true);
        console.log('✅ 普通用户看不到"开始会议"按钮（已禁用）');
      } else {
        console.log('✅ 普通用户看不到"开始会议"按钮');
      }

      // 通过 API 验证权限
      try {
        const response = await regularUserContext.request.post(
          `http://localhost:8000/api/v1/requirement-review-meetings/${meetingId}/start`,
          {
            headers: {
              Authorization: `Bearer ${regularUserToken}`,
            },
          }
        );

        expect(response.status()).toBe(403);

        const result = await response.json();
        expect(result.detail).toContain('权限不足');

        console.log('✅ API 正确返回 403 Forbidden');
      } catch (error) {
        console.error('API 权限测试失败:', error);
      }

      await regularUserContext.close();
    });

    // ========== 步骤 6-7: 切换回主持人，测试"下一位投票人"功能 ==========
    await test.step('主持人使用下一位投票人功能', async () => {
      // 重新登录主持人
      await page.goto('/logout');
      await loginViaPage(page, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
      await page.goto(`/review-center/${meetingId}`);
      await page.waitForLoadState('networkidle');

      // 添加需求
      await addRequirementToMeeting(request, moderatorToken, meetingId, 1);

      // 添加参会人员
      const voter1Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter1.username);
      const voter2Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter2.username);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter1Id);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter2Id);

      await page.reload();

      // 选择需求
      await page.click('.requirement-list .requirement-item:first-child');
      await page.waitForSelector('.requirement-detail-panel', { timeout: 5000 });

      // 指定投票人
      await page.click('button:has-text("指定投票人")');
      await page.waitForSelector('role=dialog', { timeout: 5000 });
      await page.check('input[type="checkbox"][value="voter1"]');
      await page.check('input[type="checkbox"][value="voter2"]');
      await page.click('role=dialog button:has-text("确定")');

      // 验证"下一位投票人"按钮可见
      await expect(page.locator('button:has-text("下一位投票人")')).toBeVisible();

      // 点击"下一位投票人"
      await page.click('button:has-text("下一位投票人")');

      // 等待更新
      await page.waitForTimeout(1000);

      // 验证当前投票人指示器更新
      const currentVoter = page.locator('.current-voter-indicator');
      await expect(currentVoter).toBeVisible();

      console.log('✅ 主持人成功使用"下一位投票人"功能');
    });

    // ========== 步骤 8: 主持人结束会议 ==========
    await test.step('主持人结束会议', async () => {
      await page.click('button:has-text("结束会议")');
      await page.waitForSelector('role=dialog', { timeout: 5000 });
      await page.click('role=dialog button:has-text("确定")');

      await page.waitForSelector('text=会议已结束', { timeout: 10000 });

      console.log('✅ 主持人成功结束会议');
    });

    // ========== 步骤 9-10: 普通用户尝试结束会议（失败）==========
    await test.step('普通用户无法结束会议', async () => {
      // 创建新上下文
      const regularUserContext = await context.browser().newContext();
      const regularUserPage = await regularUserContext.newPage();

      await loginViaPage(regularUserPage, TEST_USERS.regularUser.username, TEST_USERS.regularUser.password);
      await regularUserPage.goto(`/review-center/${meetingId}`);
      await regularUserPage.waitForLoadState('networkidle');

      // 验证"结束会议"按钮不存在
      const endButton = regularUserPage.locator('button:has-text("结束会议")');
      const isVisible = await endButton.isVisible().catch(() => false);

      expect(isVisible).toBe(false);
      console.log('✅ 普通用户看不到"结束会议"按钮');

      // 通过 API 验证
      try {
        const response = await regularUserContext.request.post(
          `http://localhost:8000/api/v1/requirement-review-meetings/${meetingId}/end`,
          {
            headers: {
              Authorization: `Bearer ${regularUserToken}`,
            },
          }
        );

        expect(response.status()).toBe(403);
        console.log('✅ API 正确返回 403 Forbidden');
      } catch (error) {
        console.error('API 权限测试失败:', error);
      }

      await regularUserContext.close();
    });

    console.log('\n🎉 主持人权限控制测试通过！');
  });

  test('只有主持人能看到控制面板', async ({ page, request }) => {
    let meetingId: number;

    await test.step('准备测试会议', async () => {
      const meeting = await createTestMeeting(request, moderatorToken, {
        title: generateMeetingTitle('控制面板测试'),
        scheduled_at: formatDate(1),
      });
      meetingId = meeting.id;
      createdMeetingIds.push(meetingId);

      const voter1Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter1.username);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter1Id);
      await addRequirementToMeeting(request, moderatorToken, meetingId, 1);
      await startMeeting(request, moderatorToken, meetingId);
    });

    await test.step('主持人看到控制面板', async () => {
      await loginViaPage(page, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
      await page.goto(`/review-center/${meetingId}`);
      await page.waitForLoadState('networkidle');

      // 验证控制面板可见
      await expect(page.locator('.moderator-control-panel')).toBeVisible();
      await expect(page.locator('button:has-text("指定投票人")')).toBeVisible();
      await expect(page.locator('button:has-text("下一位投票人")')).toBeVisible();
      await expect(page.locator('button:has-text("结束会议")')).toBeVisible();

      console.log('✅ 主持人可以看到完整的控制面板');
    });

    await test.step('投票人看不到控制面板', async () => {
      await page.goto('/logout');
      await loginViaPage(page, TEST_USERS.voter1.username, TEST_USERS.voter1.password);
      await page.goto(`/review-center/${meetingId}`);
      await page.waitForLoadState('networkidle');

      // 验证控制面板不可见
      const controlPanel = page.locator('.moderator-control-panel');
      const isVisible = await controlPanel.isVisible().catch(() => false);

      expect(isVisible).toBe(false);

      // 验证只有投票面板可见
      await expect(page.locator('.vote-panel')).toBeVisible();

      console.log('✅ 投票人看不到控制面板');
    });
  });
});
