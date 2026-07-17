/**
 * API权限类型
 */
export interface ApiPermission {
  id: string
  permissionName: string
  permissionCode: string
  description: string
  type: number
  parentId: string
  icon: string | null
  path: string | null
  component: string | null
  sort: number
  visible: number
  status: number
  isDeleted: number
  createTime: string
  updateTime: string
  children?: ApiPermission[]
}

/**
 * 菜单项类型（动态路由来源）
 */
export interface MenuItem {
  id: string
  name: string
  path: string
  component?: string
  code: string
  icon?: string
  sort?: number
  children?: MenuItem[]
}

/**
 * 权限项类型
 */
export interface PermissionItem {
  id: string
  permissionName: string
  permissionCode: string
  description: string
  type: number
  parentId: string
  icon: string
  path: string
  component: string
  sort: number
  visible: number
  status: number
  isDeleted: number
  createTime: string
  updateTime: string
  children?: PermissionItem[]
  hasChildren?: boolean
}

/**
 * 权限表单数据类型
 */
export interface PermissionFormData {
  id?: string
  permissionName: string
  permissionCode: string
  description: string
  type: number
  parentId: string
  icon: string
  path: string
  component: string
  sort: number
  visible: number
  status: number
}
