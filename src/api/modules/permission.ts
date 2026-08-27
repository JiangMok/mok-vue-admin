import request from "@/utils/request.ts"
import type { ApiPermission, ApiResponse, MenuItem, PageResponse, PermissionItem, PermissionTreeNode } from '@/types'

/**
 * 菜单API（动态路由来源）
 */
export const menuApi = {
  getUserMenus: (): Promise<ApiResponse<MenuItem[]>> => {
    return request.get('/permission/my-menus')
  }
}

/**
 * 权限API
 */
export const permissionApi = {
  getPage: (params: {
    pageNum: number
    pageSize: number
    keyword?: string
    params?: {
      type?: number
      status?: number
    }
  }): Promise<ApiResponse<PageResponse<PermissionItem>>> => {
    return request.post('/permission/page', params)
  },
  getUserApiPermissions: (): Promise<ApiResponse<ApiPermission[]>> => {
    return request.get('/permission/apis')
  },
  getTree: (): Promise<ApiResponse<PermissionTreeNode[]>> => {
    return request.get('/permission/tree')
  },
  getByRoleId: (roleId: string): Promise<ApiResponse<ApiPermission[]>> => {
    return request.get(`/permission/getByRoleId/${roleId}`)
  },
  getByUserId: (): Promise<ApiResponse<PermissionItem[]>> => {
    return request.get('/permission/getByUserId')
  },
  delete: (id: string): Promise<ApiResponse> => {
    return request.delete(`/permission/delete/${id}`)
  },
  add(data: ApiPermission): Promise<ApiResponse> {
    return request.post('/permission/add', data)
  },
  update(data: ApiPermission & { id: string }): Promise<ApiResponse> {
    return request.put(`/permission/update`, data)
  },
}
