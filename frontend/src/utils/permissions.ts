/**
 * 权限检查工具函数
 */

/**
 * 检查用户是否有管理员权限
 * @param user 用户对象
 * @returns 是否是管理员
 */
export function isAdmin(user: any | null): boolean {
  if (!user) return false
  
  // 检查多种可能的角色值
  const adminRoles = ['admin', 'Admin', 'ADMIN', 'administrator']
  return adminRoles.includes(user.role)
}

/**
 * 检查用户是否有特定权限
 * @param user 用户对象
 * @param permission 权限名称
 * @returns 是否有权限
 */
export function hasPermission(user: any | null, permission: string): boolean {
  if (!user) return false
  
  // 管理员拥有所有权限
  if (isAdmin(user)) return true
  
  // TODO: 实现更细粒度的权限检查
  return false
}
