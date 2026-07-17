import request from "@/utils/request.ts"
import type { ApiResponse, PageResponse, RoleItem } from '@/types'

/**
 * 角色管理API
 */
export const roleApi = {
  getAllRoles: (): Promise<ApiResponse<RoleItem[]>> => {
    return request.get('/role/all')
  },
  getUserRoles: (userId: string): Promise<ApiResponse<RoleItem[]>> => {
    return request.get(`/role/user/${userId}`)
  },
  getPage: (params: {
    pageNum: number
    pageSize: number
    roleName?: string
  }): Promise<ApiResponse<PageResponse<RoleItem>>> => {
    return request.post('/role/page', params)
  },
  addRole: (data: {
    roleName: string
    roleCode: string
    description?: string
    sort?: number
    status?: number
  }) => {
    return request.post('/role/add', data)
  },
  updateRole: (data: {
    id: string
    roleName?: string
    roleCode?: string
    description?: string
    sort?: number
    status?: number
  }) => {
    return request.put('/role/update', data)
  },
  delete: (id: string) => {
    return request.delete(`/role/delete/${id}`)
  },
  deleteRoles: (ids: string[]) => {
    return request.delete('/system/role/batchDelete', { data: { ids } })
  }
}
