import request from "@/utils/request.ts"
import type { ApiResponse, DeptItem, PageResponse } from '@/types'

/**
 * 部门管理API
 */
export const deptApi = {
  getTree: (): Promise<ApiResponse<DeptItem[]>> => {
    return request.get('/dept/tree')
  },
  getScopedTree: (): Promise<ApiResponse<DeptItem[]>> => {
    return request.get('/dept/tree/scoped')
  },
  getPage: (params: {
    pageNum: number
    pageSize: number
    keyword?: string
    status?: number
  }): Promise<ApiResponse<PageResponse<DeptItem>>> => {
    return request.post('/dept/list', params)
  },
  getById: (id: string): Promise<ApiResponse<DeptItem>> => {
    return request.get(`/dept/${id}`)
  },
  add: (data: Partial<DeptItem>): Promise<ApiResponse> => {
    return request.post('/dept/add', data)
  },
  update: (data: Partial<DeptItem>): Promise<ApiResponse> => {
    return request.put('/dept/update', data)
  },
  delete: (id: string): Promise<ApiResponse> => {
    return request.delete(`/dept/delete/${id}`)
  }
}
