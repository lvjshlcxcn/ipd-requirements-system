import type { LazyExoticComponent, ComponentType } from 'react'

export interface RouteConfig {
  path: string
  element: LazyExoticComponent<ComponentType<any>>
  title?: string
  requireAuth?: boolean
  mode?: 'create' | 'edit' | 'view'
  children?: RouteConfig[]
}

export interface MenuItem {
  key: string
  icon?: React.ReactNode
  label: string
  children?: MenuItem[]
}
