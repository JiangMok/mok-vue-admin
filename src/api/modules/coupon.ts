import request from "@/utils/request.ts"
import type { ApiResponse, CouponFormData, PageResponse, ProductItem } from '@/types'

/**
 * 优惠券管理API
 */
export const couponApi = {
  getPage: (params: {
    pageNum: number
    pageSize: number
  }): Promise<ApiResponse<PageResponse<ProductItem>>> => {
    return request.post('/coupon/list', params)
  },
  add(data: CouponFormData) {
    return request.post('/coupon/add', data)
  },
  update(data: CouponFormData) {
    return request.post('/coupon/update', data)
  },
  delete(id: string) {
    return request.delete(`/coupon/delete/${id}`)
  },
  saveProductCoupons: (params: {
    productId: string
    couponIds: string[]
  }): Promise<ApiResponse> => {
    return request.post('/coupon/saveProductCoupons', params)
  }
}
