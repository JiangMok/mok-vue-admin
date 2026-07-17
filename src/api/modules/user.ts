import request from "@/utils/request.ts"
import type { ApiResponse, PageResponse, ProfileUserInfo, UserInfo } from '@/types'

/**
 * 用户管理API
 */
export const userApi = {
  getUsers: (params: {
    pageNum: number
    pageSize: number
    username?: string
  }): Promise<ApiResponse<PageResponse<UserInfo>>> => {
    return request.post('/user/page', params)
  },
  getUserById: (id: string): Promise<ApiResponse<ProfileUserInfo>> => {
    return request.get(`/user/${id}`)
  },
  addUser: (data: Partial<UserInfo>) => {
    return request.post('/user/add', data)
  },
  updateUser: (data: Partial<UserInfo>): Promise<ApiResponse> => {
    return request.post('/user/update', data)
  },
  updateUserPwd: (data: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> => {
    return request.post('/user/updatePwd', data)
  },
  resetPwd: (id: string): Promise<ApiResponse> => {
    return request.put(`/user/resetPwd/${id}`)
  },
  deleteUser: (id: string) => {
    return request.delete(`/user/delete/${id}`)
  }
}
