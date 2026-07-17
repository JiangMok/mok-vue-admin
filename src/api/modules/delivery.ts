import request from "@/utils/request.ts"
import type { ApiResponse, DeliveryOrderEntity, PageResponse } from '@/types'

/**
 * 发货管理API
 */
export const deliveryApi = {
  getPage: (params: {
    pageNum: number
    pageSize: number
  }): Promise<ApiResponse<PageResponse<DeliveryOrderEntity>>> => {
    return request.post('/delivery/admin/list', params)
  },
  shipDelivery: (
    deliveryId: string,
    deliveryCompany: string,
    deliveryNumber: string
  ): Promise<ApiResponse> => {
    return request.post(`/delivery/ship?deliveryId=${deliveryId}&deliveryCompany=${deliveryCompany}&deliveryNumber=${deliveryNumber}`)
  },
  receiveDelivery(id: string): Promise<ApiResponse> {
    return request.post(`/delivery/receive/${id}`)
  }
}
