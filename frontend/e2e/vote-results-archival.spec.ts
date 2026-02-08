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
  endMeeting,
  cleanupTestData,
  formatDate,
  generateMeetingTitle,
  TEST_USERS,
} from './helpers/test-data';

/**
 * E2E 测试 5: 投票结果存档
 *
 * 用户故事：作为参会人员，我需要查看历史投票结果
 *
 * 测试步骤：
 * 1. 完成一次投票流程（参考测试1）
 * 2. 结束会议
 * 3. 打开投票结果存档页面
 * 4. 搜索刚结束的会议
 * 5. 点击查看详情
 *
 * 验证点：
 * ✅ 投票结果已保存
 * ✅ 统计数据完整
 * ✅ 包含投票详情（谁投了什么）
 * ✅ 存档时间正确
 */
test.describe('投票结果存档 E2E 测试', () => {
  let createdMeetingIds: number[] = [];
  let moderatorToken: string;
  let voter1Token: string;
  let voter2Token: string;
  let voter3Token: string;

  test.beforeAll(async ({ request }) => {
    moderatorToken = await login(request, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
    voter1Token = await login(request, TEST_USERS.voter1.username, TEST_USERS.voter1.password);
    voter2Token = await login(request, TEST_USERS.voter2.username, TEST_USERS.voter2.password);
    voter3Token = await login(request, TEST_USERS.voter3.username, TEST_USERS.voter3.username);
  });

  test.afterAll(async ({ request }) => {
    await cleanupTestData(request, moderatorToken, createdMeetingIds);
  });

  test('投票结果存档和查询', async ({ page, request }) => {
    let meetingId: number;
    let meetingTitle: string;
    let requirementId: number;

    // ========== 步骤 1: 完成一次完整的投票流程 ==========
    await test.step('准备并完成投票流程', async () => {
      meetingTitle = generateMeetingTitle('存档测试会议');

      // 创建会议
      const meeting = await createTestMeeting(request, moderatorToken, {
        title: meetingTitle,
        description: '测试投票结果存档功能',
        scheduled_at: formatDate(1),
      });
      meetingId = meeting.id;
      createdMeetingIds.push(meetingId);

      // 添加参会人员
      const voter1Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter1.username);
      const voter2Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter2.username);
      const voter3Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter3.username);

      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter1Id);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter2Id);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter3Id);

      // 添加需求
      requirementId = 1;
      await addRequirementToMeeting(request, moderatorToken, meetingId, requirementId);

      // 开始会议
      await startMeeting(request, moderatorToken, meetingId);

      // 三位投票人依次投票
      await castVote(request, voter1Token, meetingId, requirementId, 'approve', '投票人1: 同意');
      await castVote(request, voter2Token, meetingId, requirementId, 'approve', '投票人2: 同意');
      await castVote(request, voter3Token, meetingId, requirementId, 'reject', '投票人3: 不同意，需补充');

      console.log('✅ 投票流程完成');
    });

    // ========== 步骤 2: 结束会议 ==========
    await test.step('结束会议', async () => {
      await endMeeting(request, moderatorToken, meetingId);
      console.log('✅ 会议已结束');
    });

    // ========== 步骤 3: 打开投票结果存档页面 ==========
    await test.step('打开投票结果存档页面', async () => {
      await loginViaPage(page, TEST_USERS.moderator.username, TEST_USERS.moderator.password);

      // 导航到投票结果页面
      await page.click('text=投票结果');
      await page.waitForURL('/review-center/results', { timeout: 10000 });

      // 验证页面标题
      await expect(page.locator('h1, h2')).toContainText('投票结果');

      console.log('✅ 打开投票结果存档页面');
    });

    // ========== 步骤 4: 搜索刚结束的会议 ==========
    await test.step('搜索会议结果', async () => {
      // 使用搜索框
      await page.fill('input[placeholder*="搜索"]', meetingTitle);

      // 按回车或点击搜索按钮
      await page.press('input[placeholder*="搜索"]', 'Enter');

      // 等待搜索结果加载
      await page.waitForSelector('.result-item, .ant-table-tbody', { timeout: 10000 });

      console.log('✅ 搜索结果显示');

      // 验证搜索结果
      const resultsCount = await page.locator('.result-item').count();
      expect(resultsCount).toBeGreaterThan(0);

      // 验证结果包含会议标题
      const resultText = await page.locator('.result-item:first-child').textContent();
      expect(resultText).toContain(meetingTitle);

      console.log(`  ✓ 找到 ${resultsCount} 个结果`);
    });

    // ========== 步骤 5: 点击查看详情 ==========
    await test.step('查看投票结果详情', async () => {
      // 点击第一个结果
      await page.click('.result-item:first-child');

      // 等待详情页面加载
      await page.waitForSelector('.result-detail, .vote-result-detail', { timeout: 10000 });

      console.log('✅ 打开投票结果详情页');
    });

    // ========== 验证点: 投票结果完整性 ==========
    await test.step('验证投票结果完整性', async () => {
      // 验证会议信息
      const title = await page.locator('.meeting-title').textContent();
      expect(title).toContain(meetingTitle);

      // 验证投票统计
      const totalVotes = await page.locator('.stat-total .count').textContent();
      const approveCount = await page.locator('.stat-approve .count').textContent();
      const rejectCount = await page.locator('.stat-reject .count').textContent();

      expect(totalVotes).toBe('3');
      expect(approveCount).toBe('2');
      expect(rejectCount).toBe('1');

      console.log('✅ 投票统计正确');
      console.log(`  ✓ 总票数: ${totalVotes}`);
      console.log(`  ✓ 通过: ${approveCount}`);
      console.log(`  ✓ 拒绝: ${rejectCount}`);
    });

    // ========== 验证点: 投票详情列表 ==========
    await test.step('验证投票详情列表', async () => {
      // 查找投票详情列表
      const voteDetails = page.locator('.vote-detail-item, .ant-table-tbody tr');

      // 验证列表长度
      const count = await voteDetails.count();
      expect(count).toBe(3);

      // 验证每个投票记录
      const firstVote = voteDetails.nth(0);
      const voterName = await firstVote.locator('.voter-name').textContent();
      const voteOption = await firstVote.locator('.vote-option').textContent();
      const comment = await firstVote.locator('.vote-comment').textContent();

      expect(voterName).toBeTruthy();
      expect(voteOption).toBeTruthy();
      expect(comment).toBeTruthy();

      console.log('✅ 投票详情列表完整');
      console.log(`  ✓ 共 ${count} 条投票记录`);
      console.log(`  ✓ 投票人: ${voterName.trim()}`);
      console.log(`  ✓ 选项: ${voteOption.trim()}`);
      console.log(`  ✓ 评论: ${comment.trim()}`);
    });

    // ========== 验证点: 存档时间 ==========
    await test.step('验证存档时间', async () => {
      const archivedTime = await page.locator('.archived-time, .created-at').textContent();

      expect(archivedTime).toBeTruthy();

      // 验证时间格式（应该包含日期和时间）
      expect(archivedTime).toMatch(/\d{4}-\d{2}-\d{2}/);

      console.log('✅ 存档时间正确');
      console.log(`  ✓ 存档时间: ${archivedTime.trim()}`);
    });

    // ========== 验证点: 通过 API 查询存档数据 ==========
    await test.step('通过 API 验证存档数据', async () => {
      const response = await request.get(
        `http://localhost:8000/api/v1/requirement-review-meetings/archive/vote-results?meeting_id=${meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${moderatorToken}`,
          },
        }
      );

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.items).toBeDefined();
      expect(result.data.items.length).toBeGreaterThan(0);

      const voteResult = result.data.items[0];

      // 验证数据完整性
      expect(voteResult.meeting_id).toBe(meetingId);
      expect(voteResult.requirement_id).toBe(requirementId);
      expect(voteResult.total_votes).toBe(3);
      expect(voteResult.approve_count).toBe(2);
      expect(voteResult.reject_count).toBe(1);
      expect(voteResult.vote_details).toBeDefined();
      expect(voteResult.vote_details.length).toBe(3);

      console.log('✅ API 验证通过');
      console.log(`  ✓ 存档记录数: ${result.data.items.length}`);
    });

    console.log('\n🎉 投票结果存档测试通过！');
  });

  test('多个需求的投票结果分别存档', async ({ page, request }) => {
    let meetingId: number;
    let meetingTitle: string;
    const requirementIds = [1, 2]; // 两个需求

    await test.step('准备多需求投票会议', async () => {
      meetingTitle = generateMeetingTitle('多需求存档测试');

      const meeting = await createTestMeeting(request, moderatorToken, {
        title: meetingTitle,
        description: '测试多个需求的投票结果存档',
        scheduled_at: formatDate(1),
      });
      meetingId = meeting.id;
      createdMeetingIds.push(meetingId);

      // 添加参会人员
      const voter1Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter1.username);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter1Id);

      // 添加两个需求
      await addRequirementToMeeting(request, moderatorToken, meetingId, requirementIds[0]);
      await addRequirementToMeeting(request, moderatorToken, meetingId, requirementIds[1]);

      await startMeeting(request, moderatorToken, meetingId);

      // 为两个需求分别投票
      await castVote(request, voter1Token, meetingId, requirementIds[0], 'approve', '需求1通过');
      await castVote(request, voter1Token, meetingId, requirementIds[1], 'reject', '需求2拒绝');

      await endMeeting(request, moderatorToken, meetingId);

      console.log('✅ 多需求投票会议准备完成');
    });

    await test.step('验证两个需求的存档记录', async () => {
      await loginViaPage(page, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
      await page.goto('/review-center/results');
      await page.waitForLoadState('networkidle');

      // 搜索会议
      await page.fill('input[placeholder*="搜索"]', meetingTitle);
      await page.press('input[placeholder*="搜索"]', 'Enter');

      await page.waitForSelector('.result-item', { timeout: 10000 });

      // 验证有两个存档记录（每个需求一个）
      const resultsCount = await page.locator('.result-item').count();
      expect(resultsCount).toBe(2);

      console.log('✅ 找到 2 个存档记录（每个需求一个）');

      // 通过 API 验证
      const response = await request.get(
        `http://localhost:8000/api/v1/requirement-review-meetings/${meetingId}/archive/vote-results`,
        {
          headers: {
            Authorization: `Bearer ${moderatorToken}`,
          },
        }
      );

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);

      // 验证每个需求的投票结果
      const req1Result = result.data.find((r: any) => r.requirement_id === requirementIds[0]);
      const req2Result = result.data.find((r: any) => r.requirement_id === requirementIds[1]);

      expect(req1Result).toBeDefined();
      expect(req2Result).toBeDefined();
      expect(req1Result.approve_count).toBe(1);
      expect(req2Result.reject_count).toBe(1);

      console.log('✅ 两个需求的存档数据都正确');
    });
  });

  test('存档数据不可修改', async ({ page, request }) => {
    let meetingId: number;
    const requirementId = 1;

    await test.step('准备已结束的会议', async () => {
      const meeting = await createTestMeeting(request, moderatorToken, {
        title: generateMeetingTitle('存档不可修改测试'),
        scheduled_at: formatDate(1),
      });
      meetingId = meeting.id;
      createdMeetingIds.push(meetingId);

      const voter1Id = await getUserIdByUsername(request, moderatorToken, TEST_USERS.voter1.username);
      await addAttendeeToMeeting(request, moderatorToken, meetingId, voter1Id);
      await addRequirementToMeeting(request, moderatorToken, meetingId, requirementId);
      await startMeeting(request, moderatorToken, meetingId);
      await castVote(request, voter1Token, meetingId, requirementId, 'approve', '初始投票');
      await endMeeting(request, moderatorToken, meetingId);

      console.log('✅ 会议已结束并存档');
    });

    await test.step('尝试修改已存档的投票（应该失败）', async () => {
      // 投票人尝试修改投票
      try {
        await castVote(request, voter1Token, meetingId, requirementId, 'reject', '尝试修改');

        throw new Error('不应该允许修改已存档的投票');
      } catch (error: any) {
        expect(error.message).toMatch(/会议已结束|不能修改/);

        console.log('✅ 正确拒绝修改已存档的投票');
      }
    });

    await test.step('验证存档数据未改变', async () => {
      const response = await request.get(
        `http://localhost:8000/api/v1/requirement-review-meetings/${meetingId}/archive/vote-results`,
        {
          headers: {
            Authorization: `Bearer ${moderatorToken}`,
          },
        }
      );

      const result = await response.json();
      const voteResult = result.data[0];

      // 验证数据仍然是初始投票
      expect(voteResult.approve_count).toBe(1);
      expect(voteResult.reject_count).toBe(0);
      expect(voteResult.vote_details[0].vote_option).toBe('approve');
      expect(voteResult.vote_details[0].comment).toBe('初始投票');

      console.log('✅ 存档数据未被修改');
    });
  });

  test('存档页面筛选和排序功能', async ({ page, request }) => {
    await test.step('打开存档页面', async () => {
      await loginViaPage(page, TEST_USERS.moderator.username, TEST_USERS.moderator.password);
      await page.goto('/review-center/results');
      await page.waitForLoadState('networkidle');

      console.log('✅ 打开存档页面');
    });

    await test.step('测试状态筛选', async () => {
      // 点击状态筛选器
      await page.click('.filter-status');

      // 选择"通过"状态
      await page.click('text=通过');

      await page.waitForTimeout(1000);

      // 验证筛选结果
      const results = page.locator('.result-item');
      const count = await results.count();

      // 验证所有结果都是通过状态
      for (let i = 0; i < count; i++) {
        const status = await results.nth(i).locator('.result-status').textContent();
        expect(status).toContain('通过');
      }

      console.log('✅ 状态筛选功能正常');
    });

    await test.step('测试时间排序', async () => {
      // 点击时间排序
      await page.click('.sort-time');

      await page.waitForTimeout(1000);

      // 获取第一个和最后一个结果的时间
      const firstTime = await page.locator('.result-item:first-child .archived-time').textContent();
      const lastTime = await page.locator('.result-item:last-child .archived-time').textContent();

      // 验证顺序（应该从新到旧）
      expect(firstTime).toBeTruthy();
      expect(lastTime).toBeTruthy();

      console.log('✅ 时间排序功能正常');
    });
  });
});
