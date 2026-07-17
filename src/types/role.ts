/**
 * 角色类型定义
 */
export interface RoleItem {
  id: string
  roleName: string
  roleCode: string
  description?: string
  sort: number
  status: number
  isDeleted: number
  createTime?: string
  updateTime?: string
  name?: string
  code?: string
}

/**
 * 角色表单数据类型
 */
export interface RoleFormData {
  roleName: string
  roleCode: string
  description?: string
  sort: number
  status: number
  permissionIds: string[]
  createBy: string
}
