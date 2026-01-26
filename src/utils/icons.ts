// 图标映射表
export const iconMap: Record<string, string> = {
  'user': 'User',
  'peoples': 'UserFilled',
  'tree': 'Menu',
  'system': 'Setting',
  'log': 'Document',
  'dashboard': 'Odometer'  // Element Plus 中的仪表盘图标
}

// 获取图标组件名
export const getIconComponent = (iconName?: string): string => {
  if (!iconName) return 'Menu'

  // 检查是否已经是有效的Element Plus图标名
  if (iconName.charAt(0) === iconName.charAt(0).toUpperCase()) {
    return iconName
  }

  // 从映射表中获取
  return iconMap[iconName] || 'Menu'
}
