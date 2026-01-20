import { lazy } from 'react'
import type { RouteConfig } from '@/shared/types'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const RequirementsListPage = lazy(() => import('@/features/requirements/pages/RequirementsListPage'))
const RequirementEditPage = lazy(() => import('@/features/requirements/pages/RequirementEditPage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'))
const DistributionPage = lazy(() => import('@/features/distribution/pages/DistributionPage'))
const RTMPage = lazy(() => import('@/pages/rtm/RTMPage'))
const VerificationOverviewPage = lazy(() => import('@/pages/verifications/VerificationOverviewPage'))
const VerificationListPage = lazy(() => import('@/pages/verifications/VerificationListPage'))
const VerificationChecklistForm = lazy(() => import('@/pages/verifications/VerificationChecklistForm'))
const MainLayout = lazy(() => import('@/shared/components/layout/MainLayout'))

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
