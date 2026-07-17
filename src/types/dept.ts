/**
 * 部门类型定义
 */
export interface DeptItem {
  id: string
  deptName: string
  deptCode: string
  parentId: string
  ancestors: string
  description: string
  leader: string
  phone: string
  email: string
  sort: number
  status: number
  children?: DeptItem[]
  createBy?: string
  createTime?: string
  updateTime?: string
}
