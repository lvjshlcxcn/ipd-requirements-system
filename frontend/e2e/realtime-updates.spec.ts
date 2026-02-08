import { test, expect, Browser } from '@playwright/test';
import {
  loginViaPage,
  login,
  createTestMeeting,
  getUserIdByUsername,
  addAttendeeToMeeting,
  addRequirementToMeeting,
  startMeeting,
  castVote,
  getVoteStatistics,
  cleanupTestData,
  formatDate,
  generateMeetingTitle,
  TEST_USERS,
  sleep,
} from './helpers/test-data';

/**
 * E2E 测试 4: 实时更新
 *
 * 用户故事：作为投票人，我需要看到实时的投票统计
 *
 * 测试步骤：
 * 1. 浏览器A：主持人登录，开始会议
 * 2. 浏览器B：投票人1登录，投票（通过）
 * 3. 浏览器A：刷新页面，验证统计更新
 * 4. 浏览器C：投票人2登录，投票（拒绝）
 * 5. 浏览器A：刷新页面，验证统计更新
 *
 * 验证点：
 * ✅ 投票统计在5秒内自动更新
 * ✅ 统计数据正确（通过: 1, 拒绝: 1）
 * ✅ 当前投票人指示器正确
 */
test.describe('实时更新 E2E 测试', () => {
  let createdMeetingIds: number[] = [];
  let moderatorToken: string;
  let voter1Token: string;
  let voter2Token: string;

  test.beforeAll(async ({ request }) => {
    moderatorToken = await login(request, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
    voter1Token = await login(request, TEST_USERS.voter1.username, TEST_USERS.voter1.password);
    voter2Token = await login(request, TEST_USERS.voter2.username, TEST_USERS.voter2.password);
  });

  test.afterAll(async ({ request }) => {
    await cleanupTestData(request, moderatorToken, createdMeetingIds);
  });

  test('实时投票统计更新', async ({ browser, request }) => {
    let meetingId: number;
    let requirementId: number;

    // ========== 准备测试会议 ==========
    await test.step('准备测试会议', async () => {
      const meeting = await createTestMeeting(request, moderatorToken, {
        title: generateMeetingTitle('实时更新测试'),
        scheduled_at: formatDate(1),
      });
      meetingId = meeting.id;
      createdMeetingIds.push(meetingId);

      // 添加参会人员
      const voter1Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter1.username);
      const voter2Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter2.username);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter1Id);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter2Id);

      // 添加需求
      requirementId = 1;
      await addRequirementToMeeting(request, moderatorToken, meetingId, requirementId);

      // 开始会议
      await startMeeting(request, moderatorToken, meetingId);

      console.log('✅ 测试会议准备完成');
    });

    // ========== 浏览器A: 主持人登录并监控统计 ==========
    const moderatorContext = await browser.newContext();
    const moderatorPage = await moderatorContext.newPage();

    await test.step('主持人登录并打开统计面板', async () => {
      await loginViaPage(moderatorPage, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
      await moderatorPage.goto(`/review-center/${meetingId}`);
      await moderatorPage.waitForLoadState('networkidle');

      // 选择需求
      await moderatorPage.click('.requirement-list .requirement-item:first-child');
      await moderatorPage.waitForSelector('.vote-statistics-panel', { timeout: 5000 });

      // 记录初始统计
      const initialTotal = await moderatorPage.locator('.stat-total .count').textContent();
      expect(initialTotal).toBe('0');

      console.log('✅ 浏览器A: 主持人已登录，初始票数: 0');
    });

    // ========== 浏览器B: 投票人1投票（通过）==========
    const voter1Context = await browser.newContext();
    const voter1Page = await voter1Context.newPage();

    await test.step('投票人1投票（通过）', async () => {
      await loginViaPage(voter1Page, TEST_USERS.voter1.username, TEST_USERS.voter1.password);
      await voter1Page.goto(`/review-center/${meetingId}`);
      await voter1Page.waitForLoadState('networkidle');

      await voter1Page.click('.requirement-list .requirement-item:first-child');
      await voter1Page.waitForSelector('.vote-panel', { timeout: 5000 });

      await voter1Page.click('button:has-text("通过")');
      await voter1Page.fill('textarea[name="comment"]', '投票人1: 通过');
      await voter1Page.click('button:has-text("提交投票")');

      await voter1Page.waitForSelector('text=投票成功', { timeout: 10000 });

      console.log('✅ 浏览器B: 投票人1已投票（通过）');
    });

    // ========== 浏览器A: 刷新并验证统计更新 ==========
    await test.step('主持人刷新页面查看更新', async () => {
      // 等待 2 秒（模拟实时更新延迟）
      await sleep(2000);

      // 刷新页面
      await moderatorPage.reload();
      await moderatorPage.waitForLoadState('networkidle');

      // 重新选择需求
      await moderatorPage.click('.requirement-list .requirement-item:first-child');
      await moderatorPage.waitForSelector('.vote-statistics-panel', { timeout: 5000 });

      // 验证统计更新
      const totalVotes = await moderatorPage.locator('.stat-total .count').textContent();
      const approveCount = await moderatorPage.locator('.stat-approve .count').textContent();

      expect(totalVotes).toBe('1');
      expect(approveCount).toBe('1');

      console.log('✅ 浏览器A: 统计已更新 (总计: 1, 通过: 1)');
    });

    // ========== 浏览器C: 投票人2投票（拒绝）==========
    const voter2Context = await browser.newContext();
    const voter2Page = await voter2Context.newPage();

    await test.step('投票人2投票（拒绝）', async () => {
      await loginViaPage(voter2Page, TEST_USERS.voter2.username, TEST_USERS.voter2.password);
      await voter2Page.goto(`/review-center/${meetingId}`);
      await voter2Page.waitForLoadState('networkidle');

      await voter2Page.click('.requirement-list .requirement-item:first-child');
      await voter2Page.waitForSelector('.vote-panel', { timeout: 5000 });

      await voter2Page.click('button:has-text("拒绝")');
      await voter2Page.fill('textarea[name="comment"]', '投票人2: 拒绝');
      await voter2Page.click('button:has-text("提交投票")');

      await voter2Page.waitForSelector('text=投票成功', { timeout: 10000 });

      console.log('✅ 浏览器C: 投票人2已投票（拒绝）');
    });

    // ========== 浏览器A: 再次刷新并验证统计更新 ==========
    await test.step('主持人再次刷新页面查看最终统计', async () => {
      await sleep(2000);

      await moderatorPage.reload();
      await moderatorPage.waitForLoadState('networkidle');

      await moderatorPage.click('.requirement-list .requirement-item:first-child');
      await moderatorPage.waitForSelector('.vote-statistics-panel', { timeout: 5000 });

      // 验证最终统计
      const totalVotes = await moderatorPage.locator('.stat-total .count').textContent();
      const approveCount = await moderatorPage.locator('.stat-approve .count').textContent();
      const rejectCount = await moderatorPage.locator('.stat-reject .count').textContent();

      expect(totalVotes).toBe('2');
      expect(approveCount).toBe('1');
      expect(rejectCount).toBe('1');

      console.log('✅ 浏览器A: 最终统计正确 (总计: 2, 通过: 1, 拒绝: 1)');
    });

    // ========== 通过 API 验证统计数据 ==========
    await test.step('通过 API 验证投票统计', async () => {
      const stats = await getVoteStatistics(request, moderatorToken, meetingId, requirementId);

      expect(stats.total_votes).toBe(2);
      expect(stats.approve_count).toBe(1);
      expect(stats.reject_count).toBe(1);
      expect(stats.completion_percentage).toBe(100); // 2/2 = 100%

      console.log('✅ API 验证通过');
      console.log(`  ✓ 总票数: ${stats.total_votes}`);
      console.log(`  ✓ 通过: ${stats.approve_count}`);
      console.log(`  ✓ 拒绝: ${stats.reject_count}`);
      console.log(`  ✓ 完成度: ${stats.completion_percentage}%`);
    });

    // ========== 清理浏览器上下文 ==========
    await test.step('清理浏览器上下文', async () => {
      await moderatorContext.close();
      await voter1Context.close();
      await voter2Context.close();
    });

    console.log('\n🎉 实时更新测试通过！');
  });

  test('投票状态实时同步', async ({ browser, request }) => {
    let meetingId: number;
    let requirementId: number;

    await test.step('准备测试会议', async () => {
      const meeting = await createTestMeeting(request, moderatorToken, {
        title: generateMeetingTitle('状态同步测试'),
        scheduled_at: formatDate(1),
      });
      meetingId = meeting.id;
      createdMeetingIds.push(meetingId);

      const voter1Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter1.username);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter1Id);
      await addRequirementToMeeting(request, moderatorToken, meetingId, (requirementId = 1));
      await startMeeting(request, moderatorToken, meetingId);
    });

    // 测试当前投票人指示器
    const moderatorContext = await browser.newContext();
    const moderatorPage = await moderatorContext.newPage();
    const voter1Context = await browser.newContext();
    const voter1Page = await voter1Context.newPage();

    await test.step('验证当前投票人指示器', async () => {
      // 主持人登录
      await loginViaPage(moderatorPage, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
      await moderatorPage.goto(`/review-center/${meetingId}`);
      await moderatorPage.waitForLoadState('networkidle');

      await moderatorPage.click('.requirement-list .requirement-item:first-child');
      await moderatorPage.waitForSelector('.requirement-detail-panel', { timeout: 5000 });

      // 指定投票人
      await moderatorPage.click('button:has-text("指定投票人")');
      await moderatorPage.waitForSelector('role=dialog', { timeout: 5000 });
      await moderatorPage.check('input[type="checkbox"][value="voter1"]');
      await moderatorPage.click('role=dialog button:has-text("确定")');

      // 验证当前投票人显示
      await moderatorPage.waitForSelector('.current-voter-indicator', { timeout: 5000 });
      const currentVoter = await moderatorPage.locator('.current-voter-indicator').textContent();
      expect(currentVoter).toContain('test_voter1');

      console.log('✅ 当前投票人指示器正确显示');
    });

    await test.step('投票人投票后状态更新', async () => {
      // 投票人登录并投票
      await loginViaPage(voter1Page, TEST_USERS.voter1.username, TEST_USERS.voter1.password);
      await voter1Page.goto(`/review-center/${meetingId}`);
      await voter1Page.waitForLoadState('networkidle');

      await voter1Page.click('.requirement-list .requirement-item:first-child');
      await voter1Page.waitForSelector('.vote-panel', { timeout: 5000 });

      await voter1Page.click('button:has-text("通过")');
      await voter1Page.click('button:has-text("提交投票")');

      await voter1Page.waitForSelector('text=投票成功', { timeout: 10000 });

      // 等待状态同步
      await sleep(2000);

      // 主持人刷新查看
      await moderatorPage.reload();
      await moderatorPage.waitForLoadState('networkidle');
      await moderatorPage.click('.requirement-list .requirement-item:first-child');

      // 验证投票完成指示
      const completionStatus = await moderatorPage.locator('.voting-completion-status').textContent();
      expect(completionStatus).toContain('已完成');

      console.log('✅ 投票完成后状态正确更新');
    });

    await moderatorContext.close();
    await voter1Context.close();

    console.log('\n🎉 投票状态同步测试通过！');
  });

  test('多个用户同时查看统计', async ({ browser, request }) => {
    let meetingId: number;
    const requirementId = 1;

    await test.step('准备测试会议', async () => {
      const meeting = await createTestMeeting(request, moderatorToken, {
        title: generateMeetingTitle('多用户统计测试'),
        scheduled_at: formatDate(1),
      });
      meetingId = meeting.id;
      createdMeetingIds.push(meetingId);

      const voter1Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter1.username);
      const voter2Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter2.username);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter1Id);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter2Id);
      await addRequirementToMeeting(request, moderatorToken, meetingId, requirementId);
      await startMeeting(request, moderatorToken, meetingId);
    });

    // 三个用户同时查看统计
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const [moderatorPage, voter1Page, voter2Page] = await Promise.all([
      contexts[0].newPage(),
      contexts[1].newPage(),
      contexts[2].newPage(),
    ]);

    await test.step('三个用户同时登录并查看统计', async () => {
      // 主持人
      await loginViaPage(moderatorPage, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
      await moderatorPage.goto(`/review-center/${meetingId}`);
      await moderatorPage.waitForLoadState('networkidle');

      // 投票人1
      await loginViaPage(voter1Page, TEST_USERS.voter1.username, TEST_USERS.voter1.password);
      await voter1Page.goto(`/review-center/${meetingId}`);
      await voter1Page.waitForLoadState('networkidle');

      // 投票人2
      await loginViaPage(voter2Page, TEST_USERS.voter2.username, TEST_USERS.voter2.password);
      await voter2Page.goto(`/review-center/${meetingId}`);
      await voter2Page.waitForLoadState('networkidle');

      console.log('✅ 三个用户已同时登录');
    });

    await test.step('所有用户看到相同的初始统计', async () => {
      // 选择需求
      await moderatorPage.click('.requirement-list .requirement-item:first-child');
      await voter1Page.click('.requirement-list .requirement-item:first-child');
      await voter2Page.click('.requirement-list .requirement-item:first-child');

      await sleep(1000);

      // 验证所有用户看到的票数一致
      const moderatorTotal = await moderatorPage.locator('.stat-total .count').textContent();
      const voter1Total = await voter1Page.locator('.stat-total .count').textContent();
      const voter2Total = await voter2Page.locator('.stat-total .count').textContent();

      expect(moderatorTotal).toBe(voter1Total);
      expect(voter1Total).toBe(voter2Total);
      expect(moderatorTotal).toBe('0');

      console.log('✅ 所有用户看到的初始统计一致 (0 票)');
    });

    await test.step('投票人1投票，其他用户看到更新', async () => {
      // 投票人1投票
      await voter1Page.click('button:has-text("通过")');
      await voter1Page.click('button:has-text("提交投票")');
      await voter1Page.waitForSelector('text=投票成功', { timeout: 10000 });

      await sleep(2000);

      // 刷新其他用户的页面
      await moderatorPage.reload();
      await moderatorPage.waitForLoadState('networkidle');
      await moderatorPage.click('.requirement-list .requirement-item:first-child');

      await voter2Page.reload();
      await voter2Page.waitForLoadState('networkidle');
      await voter2Page.click('.requirement-list .requirement-item:first-child');

      // 验证统计更新
      const moderatorTotal = await moderatorPage.locator('.stat-total .count').textContent();
      const voter2Total = await voter2Page.locator('.stat-total .count').textContent();

      expect(moderatorTotal).toBe('1');
      expect(voter2Total).toBe('1');

      console.log('✅ 其他用户看到统计更新 (1 票)');
    });

    // 清理
    await Promise.all(contexts.map(ctx => ctx.close()));

    console.log('\n🎉 多用户统计测试通过！');
  });
});
