import { test, expect } from '@playwright/test';
import {
  loginViaPage,
  login,
  createTestMeeting,
  getUserIdByUsername,
  addAttendeeToMeeting,
  addRequirementToMeeting,
  startMeeting,
  castVote,
  cleanupTestData,
  formatDate,
  generateMeetingTitle,
  TEST_USERS,
} from './helpers/test-data';

/**
 * E2E 测试 2: 重复投票被拒绝
 *
 * 用户故事：作为投票人，我已经投过票，不应该能再次投票
 *
 * 测试步骤：
 * 1. 登录系统
 * 2. 创建并准备会议（添加参会人员和需求）
 * 3. 开始会议
 * 4. 投票人第一次投票（通过）
 * 5. 尝试第二次投票（拒绝）
 * 6. 验证错误消息："您已经投过票了，不能修改投票选项"
 * 7. 验证第一次投票保持不变
 *
 * 验证点：
 * ✅ 第二次投票失败
 * ✅ 显示明确的错误消息
 * ✅ 第一次投票保持不变
 */
test.describe('重复投票被拒绝 E2E 测试', () => {
  let createdMeetingIds: number[] = [];
  let moderatorToken: string;
  let voter1Token: string;

  test.beforeAll(async ({ request }) => {
    // 获取 token
    moderatorToken = await login(request, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
    voter1Token = await login(request, TEST_USERS.voter1.username, TEST_USERS.voter1.password);
  });

  test.afterAll(async ({ request }) => {
    // 清理测试数据
    await cleanupTestData(request, moderatorToken, createdMeetingIds);
  });

  test('重复投票被拒绝', async ({ page, request }) => {
    let meetingId: number;
    let requirementId: number;

    // ========== 步骤 1-3: 准备会议 ==========
    await test.step('准备测试会议', async () => {
      const meetingTitle = generateMeetingTitle('重复投票测试');

      // 创建会议
      const meeting = await createTestMeeting(request, moderatorToken, {
        title: meetingTitle,
        scheduled_at: formatDate(1),
      });
      meetingId = meeting.id;
      createdMeetingIds.push(meetingId);

      // 添加参会人员
      const voter1Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter1.username);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter1Id);

      // 添加需求（使用已知的需求 ID）
      requirementId = 1; // 假设需求 ID 为 1 存在
      await addRequirementToMeeting(request, moderatorToken, meetingId, requirementId);

      // 开始会议
      await startMeeting(request, moderatorToken, meetingId);

      console.log('✅ 测试会议准备完成');
    });

    // ========== 步骤 4: 第一次投票（通过）==========
    await test.step('第一次投票', async () => {
      // 投票人登录
      await loginViaPage(page, TEST_USERS.voter1.username, TEST_USERS.voter1.password);

      // 导航到会议详情
      await page.goto(`/review-center/${meetingId}`);
      await page.waitForLoadState('networkidle');

      // 选择需求
      await page.click('.requirement-list .requirement-item:first-child');
      await page.waitForSelector('.vote-panel', { timeout: 5000 });

      // 投票：通过
      await page.click('button:has-text("通过")');
      await page.fill('textarea[name="comment"]', '第一次投票：同意');
      await page.click('button:has-text("提交投票")');

      // 等待成功提示
      await page.waitForSelector('text=投票成功', { timeout: 10000 });

      console.log('✅ 第一次投票成功（通过）');

      // 验证投票按钮变为禁用状态
      const voteButtons = page.locator('.vote-panel button:has-text("提交投票")');
      await expect(voteButtons).toBeDisabled();
    });

    // ========== 步骤 5: 尝试第二次投票 ==========
    await test.step('尝试第二次投票（应该失败）', async () => {
      // 刷新页面
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 尝试再次投票
      await page.click('.requirement-list .requirement-item:first-child');
      await page.waitForSelector('.vote-panel', { timeout: 5000 });

      // 投票按钮应该禁用
      const submitButton = page.locator('.vote-panel button:has-text("提交投票")');
      const isDisabled = await submitButton.isDisabled();

      if (!isDisabled) {
        // 如果按钮未禁用，尝试点击并验证错误
        await page.click('button:has-text("拒绝")');
        await page.fill('textarea[name="comment"]', '第二次投票：拒绝');
        await page.click('button:has-text("提交投票")');

        // 等待错误提示
        await page.waitForSelector('text=已经投过票', { timeout: 10000 });

        // 验证错误消息
        const errorMessage = await page.locator('.ant-message-error').textContent();
        expect(errorMessage).toContain('已经投过票');

        console.log('✅ 第二次投票被阻止，显示错误消息');
      } else {
        console.log('✅ 投票按钮已禁用，无法重复投票');
      }
    });

    // ========== 步骤 6-7: 通过 API 验证第一次投票保持不变 ==========
    await test.step('验证第一次投票保持不变', async () => {
      // 通过 API 获取投票记录
      const response = await request.get(
        `http://localhost:8000/api/v1/requirement-review-meetings/${meetingId}/requirements/${requirementId}/my-vote`,
        {
          headers: {
            Authorization: `Bearer ${voter1Token}`,
          },
        }
      );

      const result = await response.json();

      // 验证投票选项
      expect(result.success).toBe(true);
      expect(result.data.vote_option).toBe('approve');
      expect(result.data.comment).toBe('第一次投票：同意');

      console.log('✅ 第一次投票记录保持不变');
      console.log(`  ✓ 投票选项: ${result.data.vote_option}`);
      console.log(`  ✓ 评论: ${result.data.comment}`);
    });

    // ========== 额外验证: 尝试通过 API 直接修改投票 ==========
    await test.step('API 拒绝修改投票', async () => {
      try {
        // 尝试通过 API 修改投票
        await castVote(request, voter1Token, meetingId, requirementId, 'reject', '尝试修改投票');

        // 如果没有抛出错误，测试失败
        throw new Error('API 应该拒绝修改投票，但没有');
      } catch (error: any) {
        // 验证错误消息
        expect(error.message).toContain('已经投过票');

        console.log('✅ API 正确拒绝修改投票请求');
      }
    });

    console.log('\n🎉 重复投票拒绝测试通过！');
  });

  test('多次快速点击提交按钮', async ({ page, request }) => {
    // ========== 边界测试: 快速连续点击提交按钮 ==========
    let meetingId: number;
    const requirementId = 1;

    await test.step('准备测试会议', async () => {
      const meetingTitle = generateMeetingTitle('快速点击测试');

      const meeting = await createTestMeeting(request, moderatorToken, {
        title: meetingTitle,
        scheduled_at: formatDate(1),
      });
      meetingId = meeting.id;
      createdMeetingIds.push(meetingId);

      const voter2Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter2.username);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter2Id);
      await addRequirementToMeeting(request, moderatorToken, meetingId, requirementId);
      await startMeeting(request, moderatorToken, meetingId);
    });

    await test.step('快速连续点击提交按钮', async () => {
      await loginViaPage(page, TEST_USERS.voter2.username, TEST_USERS.voter2.password);
      await page.goto(`/review-center/${meetingId}`);
      await page.waitForLoadState('networkidle');

      await page.click('.requirement-list .requirement-item:first-child');
      await page.waitForSelector('.vote-panel', { timeout: 5000 });

      await page.click('button:has-text("通过")');
      await page.fill('textarea[name="comment"]', '测试快速点击');

      // 快速连续点击 3 次
      const submitButton = page.locator('.vote-panel button:has-text("提交投票")');
      await submitButton.click();
      await submitButton.click();
      await submitButton.click();

      // 等待响应
      await page.waitForTimeout(2000);

      // 验证只有一票
      const response = await request.get(
        `http://localhost:8000/api/v1/requirement-review-meetings/${meetingId}/requirements/${requirementId}/votes`,
        {
          headers: {
            Authorization: `Bearer ${moderatorToken}`,
          },
        }
      );

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.total_votes).toBe(1);

      console.log('✅ 快速点击测试通过，只记录了一票');
    });
  });
});
