import request from "@/utils/request.ts"
import type { ApiResponse, CouponItem, PageResponse, ProductItem } from '@/types'

/**
 * 商品管理API
 */
export const productApi = {
  getPage: (params: {
    pageNum: number
    pageSize: number
  }): Promise<ApiResponse<PageResponse<ProductItem>>> => {
    return request.post('/product/list', params)
  },
  getById: (id: string): Promise<ApiResponse<ProductItem>> => {
    return request.get(`/product/${id}`)
  },
  add: (data: Partial<ProductItem>) => {
    return request.post('/product/add', data)
  },
  update: (data: Partial<ProductItem>) => {
    return request.post('/product/update', data)
  },
  delete: (id: string) => {
    return request.delete(`/product/delete/${id}`)
  },
  setSeckill: (data: Partial<ProductItem>) => {
    return request.post('/product/setSeckill', data)
  },
  clearSeckill: (id: string) => {
    return request.post(`/product/clearSeckill/${id}`)
  },
  getCoupons: (productId: string): Promise<ApiResponse<CouponItem[]>> => {
    return request.get(`/coupon/getCoupons/${productId}`)
  }
}
