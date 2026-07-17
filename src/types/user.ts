/**
 * 用户信息
 */
export interface UserInfo {
  id: string
  username: string
  nickname: string
  phone: string
  email: string
  avatar: string | null
  status: number
  deptId?: string
  deptName?: string
  createTime: string
  updateTime: string
}

/**
 * 个人中心用户信息（含角色和部门）
 */
export interface ProfileUserInfo {
  roleIds: string[]
  user: UserInfo
  deptName?: string
}

/**
 * 用户表单数据类型
 */
export interface UserFormData {
  username: string
  password: string
  confirmPassword?: string
  nickname: string
  phone: string
  email: string
  avatar: string
  status: number
  deptId: string
  roleIds: string[]
}

/**
 * 用户请求数据类型（提交给后端的）
 */
export interface UserRequestData {
  id?: string
  password?: string
  confirmPassword?: string
  nickname: string
  username: string
  phone: string
  email: string
  avatar: string
  status: number
  deptId?: string
  roleIds: string[]
}
