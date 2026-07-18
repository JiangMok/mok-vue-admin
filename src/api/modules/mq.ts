import request from '@/utils/request.ts'
import type { ApiResponse, MqFailedMessage, PageResponse } from '@/types'

/**
 * MQ失败消息 API
 */
export const mqFailedMessageApi = {
  getPage: (params: {
    pageNum: number
    pageSize: number
    keyword?: string
    params?: Record<string, any>
  }): Promise<ApiResponse<PageResponse<MqFailedMessage>>> => {
    return request.post('/mq-failed-message/page', params)
  },
  getById: (id: string): Promise<ApiResponse<MqFailedMessage>> => {
    return request.get(`/mq-failed-message/${id}`)
  },
  delete: (id: string): Promise<ApiResponse> => {
    return request.delete(`/mq-failed-message/${id}`)
  },
  resolve: (id: string, data: { resolvedBy: string; remark: string }): Promise<ApiResponse> => {
    return request.put(`/mq-failed-message/${id}/resolve`, data)
  }
}
