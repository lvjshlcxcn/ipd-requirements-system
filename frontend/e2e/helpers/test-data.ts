import { Page, APIRequestContext } from '@playwright/test';

/**
 * E2E 测试数据辅助函数
 *
 * 提供创建测试会议、参会人员、需求等辅助函数
 */

// API 基础路径
const API_BASE = 'http://localhost:8000/api/v1';

// 测试用户凭证
export const TEST_USERS = {
  moderator: {
    username: 'test_moderator',
    password: 'password123',
    role: 'moderator',
  },
  voter1: {
    username: 'test_voter1',
    password: 'password123',
    role: 'voter',
  },
  voter2: {
    username: 'test_voter2',
    password: 'password123',
    role: 'voter',
  },
  voter3: {
    username: 'test_voter3',
    password: 'password123',
    role: 'voter',
  },
  regularUser: {
    username: 'test_user',
    password: 'password123',
    role: 'user',
  },
};

/**
 * 登录并获取 token
 */
export async function login(
  request: APIRequestContext,
  username: string,
  password: string
): Promise<string> {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: { username, password },
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Login failed: ${data.message}`);
  }

  return data.data.access_token;
}

/**
 * 设置认证 token
 */
export function setAuthToken(token: string): string {
  return `Bearer ${token}`;
}

/**
 * 创建测试会议
 */
export async function createTestMeeting(
  request: APIRequestContext,
  token: string,
  data: {
    title: string;
    description?: string;
    scheduled_at: string;
  }
): Promise<any> {
  const response = await request.post(`${API_BASE}/requirement-review-meetings`, {
    headers: {
      Authorization: setAuthToken(token),
      'Content-Type': 'application/json',
    },
    data: {
      title: data.title,
      description: data.description || 'E2E Test Meeting',
      scheduled_at: data.scheduled_at,
      moderator_id: 1, // 测试主持人 ID
    },
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Failed to create meeting: ${result.message}`);
  }

  return result.data;
}

/**
 * 添加参会人员到会议
 */
export async function addAttendeeToMeeting(
  request: APIRequestContext,
  token: string,
  meetingId: number,
  attendeeId: number
): Promise<any> {
  const response = await request.post(
    `${API_BASE}/requirement-review-meetings/${meetingId}/attendees`,
    {
      headers: {
        Authorization: setAuthToken(token),
        'Content-Type': 'application/json',
      },
      data: {
        attendee_id: attendeeId,
        attendance_status: 'accepted',
      },
    }
  );

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Failed to add attendee: ${result.message}`);
  }

  return result.data;
}

/**
 * 获取用户列表（用于查找参会人员 ID）
 */
export async function getUsers(
  request: APIRequestContext,
  token: string
): Promise<any[]> {
  const response = await request.get(`${API_BASE}/users/`, {
    headers: {
      Authorization: setAuthToken(token),
    },
  });

  const result = await response.json();
  return result.data || result;
}

/**
 * 根据用户名查找用户 ID
 */
export async function getUserIdByUsername(
  request: APIRequestContext,
  token: string,
  username: string
): Promise<number> {
  const users = await getUsers(request, token);
  const user = users.find((u: any) => u.username === username);

  if (!user) {
    throw new Error(`User not found: ${username}`);
  }

  return user.id;
}

/**
 * 添加需求到会议
 */
export async function addRequirementToMeeting(
  request: APIRequestContext,
  token: string,
  meetingId: number,
  requirementId: number
): Promise<any> {
  const response = await request.post(
    `${API_BASE}/requirement-review-meetings/${meetingId}/requirements`,
    {
      headers: {
        Authorization: setAuthToken(token),
        'Content-Type': 'application/json',
      },
      data: {
        requirement_id: requirementId,
      },
    }
  );

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Failed to add requirement: ${result.message}`);
  }

  return result.data;
}

/**
 * 获取需求列表
 */
export async function getRequirements(
  request: APIRequestContext,
  token: string
): Promise<any[]> {
  const response = await request.get(`${API_BASE}/requirements/`, {
    headers: {
      Authorization: setAuthToken(token),
    },
  });

  const result = await response.json();
  return result.data?.items || result.data || result;
}

/**
 * 开始会议
 */
export async function startMeeting(
  request: APIRequestContext,
  token: string,
  meetingId: number
): Promise<any> {
  const response = await request.post(
    `${API_BASE}/requirement-review-meetings/${meetingId}/start`,
    {
      headers: {
        Authorization: setAuthToken(token),
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Failed to start meeting: ${result.message}`);
  }

  return result.data;
}

/**
 * 结束会议
 */
export async function endMeeting(
  request: APIRequestContext,
  token: string,
  meetingId: number
): Promise<any> {
  const response = await request.post(
    `${API_BASE}/requirement-review-meetings/${meetingId}/end`,
    {
      headers: {
        Authorization: setAuthToken(token),
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Failed to end meeting: ${result.message}`);
  }

  return result.data;
}

/**
 * 投票
 */
export async function castVote(
  request: APIRequestContext,
  token: string,
  meetingId: number,
  requirementId: number,
  voteOption: 'approve' | 'reject' | 'abstain',
  comment?: string
): Promise<any> {
  const response = await request.post(
    `${API_BASE}/requirement-review-meetings/${meetingId}/requirements/${requirementId}/vote`,
    {
      headers: {
        Authorization: setAuthToken(token),
        'Content-Type': 'application/json',
      },
      data: {
        vote_option: voteOption,
        comment: comment || '',
      },
    }
  );

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Failed to cast vote: ${result.message}`);
  }

  return result.data;
}

/**
 * 获取投票统计
 */
export async function getVoteStatistics(
  request: APIRequestContext,
  token: string,
  meetingId: number,
  requirementId: number
): Promise<any> {
  const response = await request.get(
    `${API_BASE}/requirement-review-meetings/${meetingId}/requirements/${requirementId}/votes`,
    {
      headers: {
        Authorization: setAuthToken(token),
      },
    }
  );

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Failed to get vote statistics: ${result.message}`);
  }

  return result.data;
}

/**
 * 删除测试会议
 */
export async function deleteTestMeeting(
  request: APIRequestContext,
  token: string,
  meetingId: number
): Promise<void> {
  await request.delete(`${API_BASE}/requirement-review-meetings/${meetingId}`, {
    headers: {
      Authorization: setAuthToken(token),
    },
  });
}

/**
 * 通过页面登录（用于 UI 测试）
 */
export async function loginViaPage(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto('/login');

  // 等待登录表单加载
  await page.waitForSelector('input[name="username"]', { timeout: 5000 });

  // 填写登录表单
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);

  // 提交表单
  await page.click('button[type="submit"]');

  // 等待跳转到 dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * 格式化日期为 ISO 字符串
 */
export function formatDate(daysFromNow: number = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(10, 0, 0, 0); // 设置为上午 10 点
  return date.toISOString();
}

/**
 * 生成随机会议标题
 */
export function generateMeetingTitle(prefix: string = 'E2E Test'): string {
  const timestamp = Date.now();
  return `${prefix} - ${timestamp}`;
}

/**
 * 等待一段时间（毫秒）
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 清理测试数据
 */
export async function cleanupTestData(
  request: APIRequestContext,
  token: string,
  meetingIds: number[]
): Promise<void> {
  console.log('🧹 Cleaning up test data...');

  for (const meetingId of meetingIds) {
    try {
      await deleteTestMeeting(request, token, meetingId);
      console.log(`  ✓ Deleted meeting ${meetingId}`);
    } catch (error) {
      console.error(`  ✗ Failed to delete meeting ${meetingId}:`, error);
    }
  }

  console.log('✅ Cleanup complete');
}
