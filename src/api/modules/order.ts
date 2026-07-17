import request from "@/utils/request.ts"
import type { ApiResponse, OrderInfoEntity, PageResponse } from '@/types'

/**
 * 订单管理API
 */
export const orderApi = {
  getList: (params: {
    pageNum: number
    pageSize: number
  }): Promise<ApiResponse<PageResponse<OrderInfoEntity>>> => {
    return request.post('/order/list', params)
  },
  payOrder(params: {
    orderNo: string
    payType: number
  }): Promise<ApiResponse> {
    return request.post('/order/pay', params)
  },
  cancelOrder(
    orderNo: string,
    reason: string
  ): Promise<ApiResponse> {
    return request.post(`/order/cancel?orderNo=${orderNo}&cancelReason=${reason}`)
  }
}
