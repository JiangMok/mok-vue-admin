import request from "@/utils/request.ts"
import type { ApiResponse, OperationLog, PageResponse } from '@/types'

/**
 * 系统信息API
 */
export const sysInfoApi = {
  health: (): Promise<ApiResponse> => {
    return request.get(`/system/health`)
  },
  info: (): Promise<ApiResponse> => {
    return request.get(`/system/info`)
  }
}

/**
 * 操作日志API
 */
export const operationLogApi = {
  getPage: (params: {
    pageNum: number
    pageSize: number
    keyword?: string
    businessType?: string
    status?: number
    startTime?: string
    endTime?: string
  }): Promise<ApiResponse<PageResponse<OperationLog>>> => {
    return request.post('/operation-log/page', params)
  },
  getOperationLogById: (id: string): Promise<ApiResponse<OperationLog>> => {
    return request.get(`/operation-log/${id}`)
  },
  delete: (id: string) => {
    return request.delete(`/operation-log/delete/${id}`)
  },
  cleanBefore: (time: string): Promise<ApiResponse> => {
    return request.delete(`/operation-log/clean?beforeDate=${time}`)
  }
}
