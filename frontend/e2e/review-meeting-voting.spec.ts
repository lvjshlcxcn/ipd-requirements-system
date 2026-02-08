import { test, expect, Page } from '@playwright/test';
import {
  loginViaPage,
  login,
  setAuthToken,
  createTestMeeting,
  getUserIdByUsername,
  addAttendeeToMeeting,
  getRequirements,
  addRequirementToMeeting,
  startMeeting,
  castVote,
  getVoteStatistics,
  endMeeting,
  cleanupTestData,
  formatDate,
  generateMeetingTitle,
  TEST_USERS,
} from './helpers/test-data';

/**
 * E2E 测试 1: 完整投票流程
 *
 * 用户故事：作为会议主持人，我想要创建会议并让参会人员投票
 *
 * 测试步骤：
 * 1. 登录系统
 * 2. 打开评审中心
 * 3. 创建新会议
 * 4. 添加参会人员（至少3人）
 * 5. 添加需求（至少2个）
 * 6. 开始会议
 * 7. 选择第一个需求
 * 8. 指定投票人员
 * 9. 第一个投票人投票（通过）
 * 10. 第二个投票人投票（通过）
 * 11. 第三个投票人投票（拒绝）
 * 12. 查看投票统计结果
 * 13. 结束会议
 * 14. 验证投票结果已存档
 *
 * 验证点：
 * ✅ 会议状态正确转换（scheduled → in_progress → completed）
 * ✅ 所有参会人员成功投票
 * ✅ 投票结果统计正确
 * ✅ 投票结果已保存到 vote_results 表
 */
test.describe('需求评审投票系统 E2E 测试', () => {
  // 用于清理的会议 ID 列表
  let createdMeetingIds: number[] = [];
  let moderatorToken: string;

  test.beforeAll(async ({ request }) => {
    // 获取主持人 token（用于 API 调用）
    moderatorToken = await login(
      request,
      TEST_USERS.moderator.username,
      TEST_USERS.moderator.password
    );
  });

  test.afterAll(async ({ request }) => {
    // 清理测试数据
    await cleanupTestData(request, moderatorToken, createdMeetingIds);
  });

  test('完整投票流程', async ({ page, request }) => {
    // ========== 步骤 1: 登录系统 ==========
    await test.step('登录系统', async () => {
      await loginViaPage(page, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
      await expect(page).toHaveURL('/dashboard');
      console.log('✅ 步骤 1: 登录成功');
    });

    // ========== 步骤 2: 打开评审中心 ==========
    await test.step('打开评审中心', async () => {
      await page.click('text=评审中心');
      await page.waitForURL('/review-center');
      await expect(page.locator('h1, h2')).toContainText('评审中心');
      console.log('✅ 步骤 2: 打开评审中心成功');
    });

    // ========== 步骤 3: 创建新会议 ==========
    let meetingId: number;
    let meetingTitle: string;

    await test.step('创建新会议', async () => {
      meetingTitle = generateMeetingTitle('完整投票流程测试');

      // 点击"创建会议"按钮
      await page.click('button:has-text("创建会议")');

      // 等待模态框出现
      await page.waitForSelector('role=dialog', { timeout: 5000 });

      // 填写会议信息
      await page.fill('input[name="title"]', meetingTitle);
      await page.fill('textarea[name="description"]', 'E2E 测试会议 - 完整投票流程');

      // 设置会议时间为明天
      const tomorrow = formatDate(1);
      await page.fill('input[name="scheduled_at"]', tomorrow);

      // 提交表单
      await page.click('role=dialog button:has-text("确定")');

      // 等待成功提示
      await page.waitForSelector('text=会议创建成功', { timeout: 10000 });

      // 从 URL 获取会议 ID
      const url = page.url();
      const match = url.match(/\/review-center\/(\d+)/);
      if (match) {
        meetingId = parseInt(match[1], 10);
        createdMeetingIds.push(meetingId);
        console.log(`✅ 步骤 3: 会议创建成功 (ID: ${meetingId})`);
      } else {
        throw new Error('无法从 URL 获取会议 ID');
      }
    });

    // ========== 步骤 4: 添加参会人员（至少3人）==========
    await test.step('添加参会人员', async () => {
      // 获取用户 ID
      const voter1Id = await getUserIdByUsername(
        request,
        moderatorToken,
        TEST_USERS.voter1.username
      );
      const voter2Id = await getUserIdByUsername(
        request,
        moderatorToken,
        TEST_USERS.voter2.username
      );
      const voter3Id = await getUserIdByUsername(
        request,
        moderatorToken,
        TEST_USERS.voter3.username
      );

      // 通过 API 添加参会人员
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter1Id);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter2Id);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter3Id);

      console.log('✅ 步骤 4: 已添加 3 位参会人员');

      // 刷新页面验证参会人员列表
      await page.reload();
      await page.waitForSelector('text=参会人员', { timeout: 5000 });

      // 验证参会人员数量
      const attendeeCount = await page.locator('.attendee-list .attendee-item').count();
      expect(attendeeCount).toBeGreaterThanOrEqual(3);
      console.log(`  ✓ 页面显示 ${attendeeCount} 位参会人员`);
    });

    // ========== 步骤 5: 添加需求（至少2个）==========
    let requirement1Id: number;
    let requirement2Id: number;

    await test.step('添加需求到会议', async () => {
      // 获取可用需求列表
      const requirements = await getRequirements(request, moderatorToken);

      if (requirements.length < 2) {
        throw new Error('系统中至少需要 2 个需求才能运行此测试');
      }

      requirement1Id = requirements[0].id;
      requirement2Id = requirements[1].id;

      // 通过 API 添加需求
      await addRequirementToMeeting(request, moderatorToken, meetingId, requirement1Id);
      await addRequirementToMeeting(request, moderatorToken, meetingId, requirement2Id);

      console.log(`✅ 步骤 5: 已添加 2 个需求 (ID: ${requirement1Id}, ${requirement2Id})`);

      // 刷新页面验证需求列表
      await page.reload();
      await page.waitForSelector('text=会议需求', { timeout: 5000 });

      // 验证需求数量
      const reqCount = await page.locator('.requirement-list .requirement-item').count();
      expect(reqCount).toBeGreaterThanOrEqual(2);
      console.log(`  ✓ 页面显示 ${reqCount} 个需求`);
    });

    // ========== 步骤 6: 开始会议 ==========
    await test.step('开始会议', async () => {
      // 点击"开始会议"按钮
      await page.click('button:has-text("开始会议")');

      // 等待确认对话框
      await page.waitForSelector('role=dialog', { timeout: 5000 });

      // 确认开始会议
      await page.click('role=dialog button:has-text("确定")');

      // 等待状态更新
      await page.waitForSelector('text=会议进行中', { timeout: 10000 });

      // 验证会议状态
      const statusText = await page.locator('.meeting-status').textContent();
      expect(statusText).toContain('进行中');

      console.log('✅ 步骤 6: 会议已开始');
    });

    // ========== 步骤 7: 选择第一个需求 ==========
    await test.step('选择第一个需求', async () => {
      // 点击第一个需求卡片
      await page.click('.requirement-list .requirement-item:first-child');

      // 等待需求详情面板显示
      await page.waitForSelector('.requirement-detail-panel', { timeout: 5000 });

      console.log('✅ 步骤 7: 已选择第一个需求');
    });

    // ========== 步骤 8: 指定投票人员 ==========
    await test.step('指定投票人员', async () => {
      // 点击"指定投票人"按钮
      await page.click('button:has-text("指定投票人")');

      // 等待模态框
      await page.waitForSelector('role=dialog', { timeout: 5000 });

      // 选择所有参会人员
      await page.check('input[type="checkbox"][value="voter1"]');
      await page.check('input[type="checkbox"][value="voter2"]');
      await page.check('input[type="checkbox"][value="voter3"]');

      // 提交
      await page.click('role=dialog button:has-text("确定")');

      // 等待成功提示
      await page.waitForSelector('text=投票人已指定', { timeout: 10000 });

      console.log('✅ 步骤 8: 已指定 3 位投票人');
    });

    // ========== 步骤 9-11: 三位投票人依次投票 ==========
    await test.step('第一位投票人投票（通过）', async () => {
      // 使用第一个投票人账号登录
      await loginViaPage(page, TEST_USERS.voter1.username, TEST_USERS.voter1.password);

      // 导航到会议详情
      await page.goto(`/review-center/${meetingId}`);
      await page.waitForLoadState('networkidle');

      // 点击第一个需求
      await page.click('.requirement-list .requirement-item:first-child');

      // 等待投票面板显示
      await page.waitForSelector('.vote-panel', { timeout: 5000 });

      // 投票：通过
      await page.click('button:has-text("通过")');

      // 可选：添加评论
      await page.fill('textarea[name="comment"]', '同意此需求');

      // 提交投票
      await page.click('button:has-text("提交投票")');

      // 等待成功提示
      await page.waitForSelector('text=投票成功', { timeout: 10000 });

      console.log('✅ 步骤 9: 投票人1 投票（通过）');
    });

    await test.step('第二位投票人投票（通过）', async () => {
      // 切换到第二个投票人
      await loginViaPage(page, TEST_USERS.voter2.username, TEST_USERS.voter2.password);
      await page.goto(`/review-center/${meetingId}`);
      await page.waitForLoadState('networkidle');

      await page.click('.requirement-list .requirement-item:first-child');
      await page.waitForSelector('.vote-panel', { timeout: 5000 });

      await page.click('button:has-text("通过")');
      await page.fill('textarea[name="comment"]', '赞同');
      await page.click('button:has-text("提交投票")');

      await page.waitForSelector('text=投票成功', { timeout: 10000 });

      console.log('✅ 步骤 10: 投票人2 投票（通过）');
    });

    await test.step('第三位投票人投票（拒绝）', async () => {
      // 切换到第三个投票人
      await loginViaPage(page, TEST_USERS.voter3.username, TEST_USERS.voter3.password);
      await page.goto(`/review-center/${meetingId}`);
      await page.waitForLoadState('networkidle');

      await page.click('.requirement-list .requirement-item:first-child');
      await page.waitForSelector('.vote-panel', { timeout: 5000 });

      await page.click('button:has-text("拒绝")');
      await page.fill('textarea[name="comment"]', '需求不够清晰，需要补充');
      await page.click('button:has-text("提交投票")');

      await page.waitForSelector('text=投票成功', { timeout: 10000 });

      console.log('✅ 步骤 11: 投票人3 投票（拒绝）');
    });

    // ========== 步骤 12: 查看投票统计结果 ==========
    await test.step('查看投票统计结果', async () => {
      // 切换回主持人账号
      await loginViaPage(page, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
      await page.goto(`/review-center/${meetingId}`);
      await page.waitForLoadState('networkidle');

      // 点击第一个需求
      await page.click('.requirement-list .requirement-item:first-child');

      // 等待统计面板显示
      await page.waitForSelector('.vote-statistics-panel', { timeout: 5000 });

      // 验证统计数据
      const approveCount = await page.locator('.stat-approve .count').textContent();
      const rejectCount = await page.locator('.stat-reject .count').textContent();
      const totalVotes = await page.locator('.stat-total .count').textContent();

      expect(approveCount).toBe('2'); // 2 个通过
      expect(rejectCount).toBe('1'); // 1 个拒绝
      expect(totalVotes).toBe('3'); // 共 3 票

      // 通过 API 验证
      const stats = await getVoteStatistics(request, moderatorToken, meetingId, requirement1Id);
      expect(stats.total_votes).toBe(3);
      expect(stats.approve_count).toBe(2);
      expect(stats.reject_count).toBe(1);

      console.log('✅ 步骤 12: 投票统计验证成功');
      console.log(`  ✓ 通过: ${stats.approve_count}, 拒绝: ${stats.reject_count}, 总计: ${stats.total_votes}`);
    });

    // ========== 步骤 13: 结束会议 ==========
    await test.step('结束会议', async () => {
      // 点击"结束会议"按钮
      await page.click('button:has-text("结束会议")');

      // 等待确认对话框
      await page.waitForSelector('role=dialog', { timeout: 5000 });

      // 确认结束会议
      await page.click('role=dialog button:has-text("确定")');

      // 等待状态更新
      await page.waitForSelector('text=会议已结束', { timeout: 10000 });

      // 验证会议状态
      const statusText = await page.locator('.meeting-status').textContent();
      expect(statusText).toContain('已结束');

      console.log('✅ 步骤 13: 会议已结束');
    });

    // ========== 步骤 14: 验证投票结果已存档 ==========
    await test.step('验证投票结果存档', async () => {
      // 导航到投票结果存档页面
      await page.click('text=投票结果');
      await page.waitForURL('/review-center/results', { timeout: 10000 });

      // 搜索刚结束的会议
      await page.fill('input[placeholder*="搜索"]', meetingTitle);
      await page.press('input[placeholder*="搜索"]', 'Enter');

      // 等待搜索结果
      await page.waitForSelector('.result-item', { timeout: 10000 });

      // 验证结果显示
      const resultText = await page.locator('.result-item').textContent();
      expect(resultText).toContain(meetingTitle);

      // 点击查看详情
      await page.click('.result-item:first-child');

      // 验证详情页面
      await page.waitForSelector('.result-detail', { timeout: 5000 });

      // 验证投票详情存在
      const voteDetails = await page.locator('.vote-detail-item').count();
      expect(voteDetails).toBe(3); // 应该有 3 条投票记录

      console.log('✅ 步骤 14: 投票结果已成功存档');
      console.log('  ✓ 存档页面显示投票详情');
    });

    console.log('\n🎉 完整投票流程测试通过！');
  });
});
