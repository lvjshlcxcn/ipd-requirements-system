import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { Spin } from 'antd'
import { routeConfigs, DEFAULT_REDIRECT } from './routes'
import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute'

const PageLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

function renderRoutes(configs: typeof routeConfigs) {
  return configs.flatMap((config) => {
    if (config.children) {
      return [
        <Route
          key={config.path}
          path={config.path}
          element={
            <Suspense fallback={<PageLoading />}>
              {config.requireAuth ? <ProtectedRoute><config.element /></ProtectedRoute> : <config.element />}
            </Suspense>
          }
        >
          {config.path === '/' && <Route index element={<Navigate to={DEFAULT_REDIRECT} replace />} />}
          {config.children.map(child => (
            <Route
              key={child.path}
              path={child.path}
              element={<child.element {...(child as any)} />}
            />
          ))}
        </Route>
      ]
    }
    return (
      <Route
        key={config.path}
        path={config.path}
        element={
          <Suspense fallback={<PageLoading />}>
            {config.requireAuth ? <ProtectedRoute><config.element /></ProtectedRoute> : <config.element />}
          </Suspense>
        }
      />
    )
  })
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {renderRoutes(routeConfigs)}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
