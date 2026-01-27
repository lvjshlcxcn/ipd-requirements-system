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

// Mock RTM (Requirements Traceability Matrix) data
export const mockRTMData = [
  {
    requirement_id: 1,
    requirement_title: '用户登录功能',
    requirement_no: 'REQ-2026-0001',
    design_items: [
      { id: 1, design_id: 'DESIGN-001', title: '登录模块设计' },
      { id: 2, design_id: 'DESIGN-002', title: '认证流程设计' },
    ],
    code_items: [
      { id: 3, code_id: 'CODE-001', file_path: 'src/auth/login.tsx' },
    ],
    test_items: [
      { id: 4, test_id: 'TEST-001', title: '登录功能测试' },
    ],
  },
  {
    requirement_id: 2,
    requirement_title: '数据导出功能',
    requirement_no: 'REQ-2026-0002',
    design_items: [],
    code_items: [],
    test_items: [],
  },
]

// Mock RTM link data
export const mockRTMLink = {
  id: 1,
  requirement_id: 1,
  design_id: 'DESIGN-001',
  code_id: 'CODE-001',
  test_id: 'TEST-001',
  status: 'active',
  notes: '测试关联',
  created_at: '2026-01-18T00:00:00Z',
  updated_at: '2026-01-18T00:00:00Z',
}

// Mock Prompt Template data
export const mockPromptTemplates = [
  {
    id: 1,
    template_key: 'ipd_ten_questions',
    version: 'v1.0',
    name: 'IPD 十问模板 v1.0',
    description: 'IPD需求十问标准模板',
    content: '请分析以下需求：\n1. 用户价值\n2. 市场需求\n...',
    variables: ['text', 'user_name'],
    is_active: true,
    tenant_id: 1,
    created_by: 1,
    created_at: '2026-01-26T00:00:00Z',
    updated_at: '2026-01-26T00:00:00Z',
  },
  {
    id: 2,
    template_key: 'quick_insight',
    version: 'v1.0',
    name: '快速分析模板 v1.0',
    description: '快速需求分析模板',
    content: '快速分析需求：\n{requirement_text}',
    variables: ['requirement_text'],
    is_active: true,
    tenant_id: 1,
    created_by: 1,
    created_at: '2026-01-26T00:00:00Z',
    updated_at: '2026-01-26T00:00:00Z',
  },
]

// Mock verification checklist data
export const mockVerificationChecklist = {
  id: 1,
  requirement_id: 1,
  checklist_items: [
    {
      id: 1,
      category: '功能完整性',
      question: '是否实现了所有必需功能？',
      checked: true,
      notes: '已完成',
      checked_by: 1,
      checked_at: '2026-01-18T00:00:00Z',
    },
    {
      id: 2,
      category: '性能',
      question: '是否满足性能要求？',
      checked: false,
      notes: '',
      checked_by: null,
      checked_at: null,
    },
  ],
  progress: {
    total: 2,
    completed: 1,
    percentage: 50,
  },
}

// Mock insight data
export const mockInsights = [
  {
    id: 1,
    requirement_id: 1,
    insight_type: 'appeals',
    title: 'APPEALS 分析结果',
    summary: '该需求在性能方面表现优秀',
    details: { score: 8.5, recommendations: ['建议优先实施'] },
    created_at: '2026-01-18T00:00:00Z',
  },
  {
    id: 2,
    requirement_id: 1,
    insight_type: 'user_feedback',
    title: '用户反馈',
    summary: '用户期望该功能能够快速响应',
    details: { feedback_count: 15, sentiment: 'positive' },
    created_at: '2026-01-18T00:00:00Z',
  },
]

// Mock users with different roles
export const mockUsers = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    full_name: 'Admin User',
    tenant_id: 1,
  },
  user: {
    id: 2,
    username: 'testuser',
    email: 'user@example.com',
    role: 'user',
    full_name: 'Test User',
    tenant_id: 1,
  },
  guest: {
    id: 3,
    username: 'guest',
    email: 'guest@example.com',
    role: 'guest',
    full_name: 'Guest User',
    tenant_id: 1,
  },
}

// Mock authentication responses
export const mockAuthResponses = {
  loginSuccess: {
    success: true,
    message: 'Login successful',
    data: {
      access_token: 'mock-access-token',
      token_type: 'bearer',
      user: mockUsers.admin,
    },
  },
  loginFailed: {
    success: false,
    message: '用户名或密码错误',
    data: null,
  },
  logoutSuccess: {
    success: true,
    message: '退出登录成功',
  },
}

// Mock API error responses
export const mockApiErrors = {
  unauthorized: {
    success: false,
    message: '未授权，请先登录',
    error: 'Unauthorized',
  },
  forbidden: {
    success: false,
    message: '没有权限访问此资源',
    error: 'Forbidden',
  },
  notFound: {
    success: false,
    message: '资源不存在',
    error: 'Not Found',
  },
  serverError: {
    success: false,
    message: '服务器内部错误',
    error: 'Internal Server Error',
  },
  networkError: {
    success: false,
    message: '网络连接失败',
    error: 'Network Error',
  },
}

