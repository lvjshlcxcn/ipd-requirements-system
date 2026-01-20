import { lazy } from 'react'
import type { RouteConfig } from '@/shared/types'

// 使用 React.lazy 加载组件 - 修复为正确的方式
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const RequirementsListPage = lazy(() => import('@/features/requirements/pages/RequirementsListPage').then(m => ({ default: m.RequirementsListPage })))
const RequirementEditPage = lazy(() => import('@/features/requirements/pages/RequirementEditPage').then(m => ({ default: m.RequirementEditPage })))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const DistributionPage = lazy(() => import('@/features/distribution/pages/DistributionPage').then(m => ({ default: m.DistributionPage })))
const RTMPage = lazy(() => import('@/pages/rtm/RTMPage').then(m => ({ default: m.RTMPage })))
const VerificationOverviewPage = lazy(() => import('@/pages/verifications/VerificationOverviewPage'))
const VerificationListPage = lazy(() => import('@/pages/verifications/VerificationListPage'))
const VerificationChecklistForm = lazy(() => import('@/pages/verifications/VerificationChecklistForm'))
const MainLayout = lazy(() => import('@/shared/components/layout/MainLayout').then(m => ({ default: m.MainLayout })))

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
      { path: '/requirements', element: RequirementsListPage, title: '需求管理' },
      { path: '/requirements/new', element: RequirementEditPage, title: '新建需求' },
      { path: '/requirements/edit/:id', element: RequirementEditPage, title: '编辑需求' },
      { path: '/analytics', element: AnalyticsPage, title: '需求分析' },
      { path: '/distribution', element: DistributionPage, title: '需求分发' },
      { path: '/rtm', element: RTMPage, title: '需求跟踪' },
      { path: '/verification', element: VerificationOverviewPage, title: '需求验证' },
      { path: '/requirements/:requirementId/verification', element: VerificationListPage, title: '验证清单' },
      { path: '/requirements/:requirementId/verification/create', element: VerificationChecklistForm, title: '创建验证清单', mode: 'create' },
      { path: '/requirements/:requirementId/verification/:checklistId', element: VerificationChecklistForm, title: '查看验证清单', mode: 'view' },
      { path: '/requirements/:requirementId/verification/:checklistId/edit', element: VerificationChecklistForm, title: '编辑验证清单', mode: 'edit' },
    ],
  },
]

export const DEFAULT_REDIRECT = '/dashboard'
