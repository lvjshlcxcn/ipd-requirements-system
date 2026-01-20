import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

import { DEFAULT_REDIRECT } from './routes'

const PageLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
)

// 懒加载页面组件
// 注意: 命名导出的组件需要 .then(m => ({ default: m.ComponentName }))
// 默认导出的组件可以直接使用
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const RequirementsListPage = lazy(() => import('@/features/requirements/pages/RequirementsListPage').then(m => ({ default: m.RequirementsListPage })))
const RequirementEditPage = lazy(() => import('@/features/requirements/pages/RequirementEditPage').then(m => ({ default: m.RequirementEditPage })))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const DistributionPage = lazy(() => import('@/features/distribution/pages/DistributionPage').then(m => ({ default: m.DistributionPage })))
const RTMPage = lazy(() => import('@/pages/rtm/RTMPage').then(m => ({ default: m.RTMPage })))
// 验证页面使用默认导出，不需要 .then() 转换
const VerificationOverviewPage = lazy(() => import('@/pages/verifications/VerificationOverviewPage'))
const VerificationListPage = lazy(() => import('@/pages/verifications/VerificationListPage'))
const VerificationChecklistForm = lazy(() => import('@/pages/verifications/VerificationChecklistForm'))
const MainLayout = lazy(() => import('@/shared/components/layout/MainLayout').then(m => ({ default: m.MainLayout })))

function LayoutWrapper() {
  return (
    <Suspense fallback={<PageLoading />}>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </Suspense>
  )
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={
          <Suspense fallback={<PageLoading />}>
            <LoginPage />
          </Suspense>
        } />
        
        {/* 主布局路由 */}
        <Route path="/" element={<LayoutWrapper />}>
          <Route index element={<Navigate to={DEFAULT_REDIRECT} replace />} />
          <Route path="/dashboard" element={
            <Suspense fallback={<PageLoading />}>
              <DashboardPage />
            </Suspense>
          } />
          <Route path="/requirements" element={
            <Suspense fallback={<PageLoading />}>
              <RequirementsListPage />
            </Suspense>
          } />
          <Route path="/requirements/new" element={
            <Suspense fallback={<PageLoading />}>
              <RequirementEditPage />
            </Suspense>
          } />
          <Route path="/requirements/edit/:id" element={
            <Suspense fallback={<PageLoading />}>
              <RequirementEditPage />
            </Suspense>
          } />
          <Route path="/analytics" element={
            <Suspense fallback={<PageLoading />}>
              <AnalyticsPage />
            </Suspense>
          } />
          <Route path="/distribution" element={
            <Suspense fallback={<PageLoading />}>
              <DistributionPage />
            </Suspense>
          } />
          <Route path="/rtm" element={
            <Suspense fallback={<PageLoading />}>
              <RTMPage />
            </Suspense>
          } />
          <Route path="/verification" element={
            <Suspense fallback={<PageLoading />}>
              <VerificationOverviewPage />
            </Suspense>
          } />
          <Route path="/requirements/:requirementId/verification" element={
            <Suspense fallback={<PageLoading />}>
              <VerificationListPage />
            </Suspense>
          } />
          <Route path="/requirements/:requirementId/verification/create" element={
            <Suspense fallback={<PageLoading />}>
              <VerificationChecklistForm mode="create" />
            </Suspense>
          } />
          <Route path="/requirements/:requirementId/verification/:checklistId" element={
            <Suspense fallback={<PageLoading />}>
              <VerificationChecklistForm mode="view" />
            </Suspense>
          } />
          <Route path="/requirements/:requirementId/verification/:checklistId/edit" element={
            <Suspense fallback={<PageLoading />}>
              <VerificationChecklistForm mode="edit" />
            </Suspense>
          } />
        </Route>
        
        {/* 404 重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
