import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { Spin } from 'antd'
import { routeConfigs, DEFAULT_REDIRECT } from './routes'

const PageLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={routeConfigs[0].element} />
        
        {/* 主布局路由 */}
        <Route path="/" element={routeConfigs[1].element}>
          {routeConfigs[1].children?.map((child) => (
            <Route
              key={child.path}
              path={child.path}
              element={child.element}
            />
          ))}
          
          {/* 默认重定向 */}
          <Route index element={<Navigate to={DEFAULT_REDIRECT} replace />} />
        </Route>
        
        {/* 404 重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
