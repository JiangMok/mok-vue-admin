// 图标映射表 — 将后端短键名映射为 Element Plus 图标组件名
// 后端菜单 icon 字段传短键名（如 "user"），前端通过此表找到对应图标组件
// 如果是首字母大写的字符串，会被直接当作 Element Plus 图标名使用
export const iconMap: Record<string, string> = {
  // ── 用户 / 人员 ──
  'user': 'User',
  'user-filled': 'UserFilled',
  'peoples': 'UserFilled',
  'avatar': 'Avatar',
  'profile': 'Avatar',
  'account': 'User',
  'team': 'UserFilled',
  'contacts': 'List',

  // ── 系统 / 设置 ──
  'system': 'Setting',
  'setting': 'Setting',
  'settings': 'Setting',
  'tools': 'Tools',
  'config': 'SetUp',
  'setup': 'SetUp',
  'wrench': 'Tools',
  'repair': 'Tools',

  // ── 安全 / 权限 ──
  'lock': 'Lock',
  'unlock': 'Unlock',
  'key': 'Key',
  'shield': 'CircleCheckFilled',
  'security': 'Lock',
  'permission': 'Operation',
  'role': 'Management',
  'auth': 'Key',

  // ── 菜单 / 导航 ──
  'menu': 'Menu',
  'tree': 'Menu',
  'collapse': 'Fold',
  'expand': 'Expand',
  'home': 'HomeFilled',
  'dashboard': 'Odometer',
  'back': 'ArrowLeft',
  'forward': 'ArrowRight',

  // ── 文档 / 文件 ──
  'document': 'Document',
  'doc': 'Document',
  'file': 'Document',
  'files': 'Files',
  'folder': 'Folder',
  'folder-open': 'FolderOpened',
  'log': 'Document',
  'note': 'Postcard',
  'article': 'Reading',
  'post': 'Postcard',
  'copy': 'CopyDocument',
  'ticket': 'Tickets',
  'book': 'Reading',
  'contract': 'Document',
  'attachment': 'Paperclip',

  // ── 编辑 / 操作 ──
  'edit': 'Edit',
  'write': 'EditPen',
  'pen': 'EditPen',
  'plus': 'Plus',
  'add': 'Plus',
  'minus': 'Minus',
  'remove': 'Remove',
  'delete': 'Delete',
  'close': 'Close',
  'check': 'Check',
  'finished': 'Finished',
  'save': 'Select',
  'search': 'Search',
  'refresh': 'Refresh',
  'reset': 'RefreshLeft',
  'sync': 'Refresh',
  'copy-action': 'CopyDocument',

  // ── 数据 / 图表 ──
  'data': 'DataAnalysis',
  'data-analysis': 'DataAnalysis',
  'chart': 'TrendCharts',
  'chart-bar': 'Histogram',
  'chart-pie': 'PieChart',
  'chart-line': 'TrendCharts',
  'statistics': 'DataAnalysis',
  'trend': 'TrendCharts',
  'analysis': 'DataAnalysis',
  'report': 'TrendCharts',
  'dashboard-chart': 'TrendCharts',

  // ── 邮件 / 消息 ──
  'mail': 'Message',
  'email': 'Message',
  'message': 'Message',
  'chat': 'ChatDotRound',
  'comment': 'ChatLineSquare',
  'bell': 'Bell',
  'notification': 'Bell',
  'notice': 'Bell',
  'announcement': 'Bell',

  // ── 图片 / 媒体 ──
  'image': 'Picture',
  'picture': 'Picture',
  'photo': 'PictureFilled',
  'video': 'VideoCamera',
  'camera': 'Camera',
  'film': 'VideoPlay',
  'media': 'Picture',

  // ── 上传 / 下载 ──
  'upload': 'Upload',
  'download': 'Download',
  'cloud-upload': 'UploadFilled',
  'cloud-download': 'Download',

  // ── 时间 / 日期 ──
  'time': 'Clock',
  'clock': 'Clock',
  'calendar': 'Calendar',
  'date': 'Calendar',
  'timer': 'Timer',
  'history': 'Clock',

  // ── 状态 / 标签 ──
  'success': 'SuccessFilled',
  'warning': 'WarningFilled',
  'danger': 'CircleCloseFilled',
  'info': 'InfoFilled',
  'error': 'CircleCloseFilled',
  'star': 'Star',
  'star-filled': 'StarFilled',
  'like': 'StarFilled',
  'tag': 'Collection',
  'label': 'Collection',
  'flag': 'Flag',

  // ── 位置 / 地图 ──
  'location': 'Location',
  'map': 'MapLocation',
  'address': 'LocationFilled',
  'position': 'Location',
  'place': 'Place',

  // ── 设备 / 硬件 ──
  'monitor': 'Monitor',
  'cpu': 'Cpu',
  'device': 'Iphone',
  'phone': 'Phone',
  'mobile': 'Iphone',
  'printer': 'Printer',
  'server': 'Monitor',

  // ── 链接 / 网络 ──
  'link': 'Link',
  'connection': 'Connection',
  'disconnect': 'TurnOff',
  'share': 'Share',
  'chain': 'Link',
  'api': 'Connection',

  // ── 购物 / 商务 ──
  'shop': 'Shop',
  'store': 'Shop',
  'goods': 'Goods',
  'goods-filled': 'GoodsFilled',
  'cart': 'ShoppingCart',
  'shopping': 'ShoppingBag',
  'order': 'Tickets',
  'price': 'Coin',
  'money': 'Money',
  'wallet': 'Wallet',
  'coin': 'Coin',
  'sale': 'Sell',
  'promotion': 'Promotion',

  // ── 组织 / 建筑 ──
  'org': 'OfficeBuilding',
  'dept': 'OfficeBuilding',
  'department': 'OfficeBuilding',
  'building': 'OfficeBuilding',
  'school': 'School',
  'home-building': 'House',

  // ── 排序 / 筛选 ──
  'sort': 'Sort',
  'sort-asc': 'SortUp',
  'sort-desc': 'SortDown',
  'filter': 'Filter',
  'grid': 'Grid',
  'list': 'List',

  // ── 视图 / 展示 ──
  'view': 'View',
  'hide': 'Hide',
  'eye': 'View',
  'fullscreen': 'FullScreen',
  'zoom-in': 'ZoomIn',
  'zoom-out': 'ZoomOut',
  'expand-view': 'FullScreen',

  // ── 帮助 / 指南 ──
  'help': 'Help',
  'guide': 'Guide',
  'question': 'QuestionFilled',
  'support': 'HelpFilled',

  // ── 开关 / 控制 ──
  'switch': 'Switch',
  'toggle': 'SwitchButton',
  'power': 'TurnOff',
  'on-off': 'Switch',

  // ── 杂项 ──
  'loading': 'Loading',
  'gift': 'Present',
  'trophy': 'Trophy',
  'medal': 'Medal',
  'crown': 'Trophy',
  'rank': 'Rank',
  'aim': 'Aim',
  'target': 'Aim',
  'compass': 'Compass',
  'magic': 'MagicStick',
  'brush': 'Brush',
  'color': 'Brush',
  'clip': 'Paperclip',
  'airplane': 'Promotion',
  'truck': 'Van',
  'water': 'Dish',
  'fire': 'Sunny',
  'moon': 'Moon',
  'sun': 'Sunny',
  'weather': 'MostlyCloudy',

  // ── 操作日志 / 审计 ──
  'audit': 'DocumentChecked',
  'operation': 'Operation',
  'operate-log': 'Notebook',
  'journal': 'Notebook',

  // ── 工作流 / 流程 ──
  'workflow': 'Share',
  'process': 'SetUp',
  'task': 'Finished',
  'todo': 'List',
  'approval': 'Checked',
}

// 获取图标组件名
// - 如果 iconName 以大写字母开头，视为已有效的 Element Plus 图标名，直接返回
// - 如果 iconName 能匹配 iconMap 中的键，返回对应的图标名
// - 否则返回 'Menu' 作为兜底图标
export const getIconComponent = (iconName?: string): string => {
  if (!iconName) return 'Menu'

  // 检查是否已经是有效的Element Plus图标名（首字母大写）
  if (iconName.charAt(0) === iconName.charAt(0).toUpperCase()) {
    return iconName
  }

  // 从映射表中获取
  return iconMap[iconName] || 'Menu'
}
