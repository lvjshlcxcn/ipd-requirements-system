export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('zh-CN')
}

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('zh-CN')
}

export const formatNumber = (num: number, decimals = 2): string => {
  return num.toFixed(decimals)
}
