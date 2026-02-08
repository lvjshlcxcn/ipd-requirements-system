import { lazy } from 'react'
import type { RouteConfig } from '@/shared/types'

// 使用 React.lazy 加载组件 - 修复为正确的方式
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const RequirementsListPage = lazy(() => import('@/features/requirements/pages/RequirementsListPage').then(m => ({ default: m.RequirementsListPage })))
const RequirementEditPage = lazy(() => import('@/features/requirements/pages/RequirementEditPage').then(m => ({ default: m.RequirementEditPage })))
const InsightsListPage = lazy(() => import('@/features/insights').then(m => ({ default: m.InsightsListPage })))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const DistributionPage = lazy(() => import('@/features/distribution/pages/DistributionPage').then(m => ({ default: m.DistributionPage })))
const RTMPage = lazy(() => import('@/pages/rtm/RTMPage').then(m => ({ default: m.RTMPage })))
const VerificationOverviewPage = lazy(() => import('@/pages/verifications/VerificationOverviewPage'))
const VerificationListPage = lazy(() => import('@/pages/verifications/VerificationListPage'))
const VerificationChecklistForm = lazy(() => import('@/pages/verifications/VerificationChecklistForm'))
const MainLayout = lazy(() => import('@/shared/components/layout/MainLayout').then(m => ({ default: m.MainLayout })))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const IPDStoryFlowPage = lazy(() => import('@/pages/ipd-story/IPDStoryFlowPage').then(m => ({ default: m.IPDStoryFlowPage })))
const DevelopmentPage = lazy(() => import('@/pages/development/DevelopmentPage').then(m => ({ default: m.DevelopmentPage })))
const ReviewCenterPage = lazy(() => import('@/pages/review-center/ReviewCenterPage').then(m => ({ default: m.ReviewCenterPage })))
const ReviewMeetingDetailPage = lazy(() => import('@/pages/review-center/ReviewMeetingDetailPage').then(m => ({ default: m.ReviewMeetingDetailPage })))
const VoteResultsPage = lazy(() => import('@/pages/review-center/VoteResultsPage').then(m => ({ default: m.VoteResultsPage })))
const VoteResultDetailPage = lazy(() => import('@/pages/review-center/VoteResultDetailPage').then(m => ({ default: m.VoteResultDetailPage })))

export const routeConfigs: RouteConfig[] = [
  {
    path: '/login',
    element: LoginPage,
    title: '登录',
    requireAuth: false,
  },
  {
    path: '/',
    element: MainLayout,
    requireAuth: true,
    children: [
      { path: '/dashboard', element: DashboardPage, title: '仪表盘' },
      { path: '/requirements', element: RequirementsListPage, title: '需求输入' },
      { path: '/requirements/new', element: RequirementEditPage, title: '新建需求' },
      { path: '/requirements/edit/:id', element: RequirementEditPage, title: '编辑需求' },
      { path: '/insights', element: InsightsListPage, title: 'AI洞察历史记录' },
      { path: '/analytics', element: AnalyticsPage, title: '需求分析' },
      { path: '/distribution', element: DistributionPage, title: '需求分发' },
      { path: '/development', element: DevelopmentPage, title: '需求开发' },
      { path: '/review-center', element: ReviewCenterPage, title: '评审中心' },
      { path: '/review-center/results', element: VoteResultsPage, title: '投票结果列表' },
      { path: '/review-center/results/:resultId', element: VoteResultDetailPage, title: '投票结果详情' },
      { path: '/review-center/:id', element: ReviewMeetingDetailPage, title: '会议详情' },
      { path: '/rtm', element: RTMPage, title: '需求追溯矩阵 (RTM)' },
      { path: '/verification', element: VerificationOverviewPage, title: '需求验证' },
      { path: '/ipd-story-flow', element: IPDStoryFlowPage, title: 'IPD需求十问' },
      { path: '/requirements/:requirementId/verification', element: VerificationListPage, title: '验证清单' },
      { path: '/requirements/:requirementId/verification/create', element: VerificationChecklistForm, title: '创建验证清单', mode: 'create' },
      { path: '/requirements/:requirementId/verification/:checklistId', element: VerificationChecklistForm, title: '查看验证清单', mode: 'view' },
      { path: '/requirements/:requirementId/verification/:checklistId/edit', element: VerificationChecklistForm, title: '编辑验证清单', mode: 'edit' },
      { path: '/settings', element: SettingsPage, title: '配置' },
    ],
  },
]

export const DEFAULT_REDIRECT = '/dashboard'
