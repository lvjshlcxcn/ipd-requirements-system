// Mock user data
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  full_name: 'Test User',
}

// Mock login response
export const mockLoginResponse = {
  success: true,
  message: 'Login successful',
  data: {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    user: mockUser,
  },
}

// Mock requirement data
export const mockRequirements = [
  {
    id: 1,
    requirement_no: 'REQ-2026-0001',
    title: '用户登录功能',
    description: '实现用户名密码登录',
    source_channel: 'customer',
    status: 'collected',
    priority_score: 3,
    created_at: '2026-01-18T00:00:00Z',
    updated_at: '2026-01-18T00:00:00Z',
  },
  {
    id: 2,
    requirement_no: 'REQ-2026-0002',
    title: '数据导出功能',
    description: '支持导出为 Excel',
    source_channel: 'market',
    status: 'analyzing',
    priority_score: 2,
    created_at: '2026-01-18T00:00:00Z',
    updated_at: '2026-01-18T00:00:00Z',
  },
  {
    id: 3,
    requirement_no: 'REQ-2026-0003',
    title: 'APPEALS 分析',
    description: '8 维度分析',
    source_channel: 'rd',
    status: 'analyzed',
    priority_score: 4,
    created_at: '2026-01-18T00:00:00Z',
    updated_at: '2026-01-18T00:00:00Z',
  },
]

// Mock APPEALS analysis data
export const mockAppealsAnalysis = {
  id: 1,
  requirement_id: 1,
  dimensions: {
    price: { score: 8, weight: 0.8, comment: '价格合理' },
    availability: { score: 7, weight: 0.7, comment: '容易获取' },
    packaging: { score: 6, weight: 0.6, comment: '包装一般' },
    performance: { score: 9, weight: 0.9, comment: '性能优秀' },
    ease_of_use: { score: 8, weight: 0.8, comment: '易于使用' },
    assurance: { score: 7, weight: 0.7, comment: '可靠稳定' },
    lifecycle_cost: { score: 6, weight: 0.6, comment: '成本适中' },
    social_acceptance: { score: 7, weight: 0.7, comment: '接受度高' },
  },
  total_weighted_score: 428.0,
  analyzed_at: '2026-01-18T00:00:00Z',
  analyzed_by: 1,
}

// Mock requirement statistics
export const mockRequirementStats = {
  total: 3,
  by_status: {
    collected: 1,
    analyzing: 1,
    analyzed: 1,
    distributing: 0,
    distributed: 0,
    implementing: 0,
    verifying: 0,
    completed: 0,
    rejected: 0,
  },
  by_channel: {
    customer: 1,
    market: 1,
    competition: 0,
    sales: 0,
    after_sales: 0,
    rd: 1,
  },
}
