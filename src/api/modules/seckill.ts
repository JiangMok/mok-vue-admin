import request from "@/utils/request.ts"
import type { ApiResponse } from '@/types'

/**
 * 秒杀管理API
 */
export const seckillApi = {
  seckillOrder: (
    productId: string,
    quantity: number,
    verifyCode: string
  ): Promise<ApiResponse> => {
    return request.post(`/seckill/order?productId=${productId}&quantity=${quantity}&verifyCode=${verifyCode}`)
  },
  getSeckillVerifyCode: (
    productId: string
  ): Promise<ApiResponse> => {
    return request.get(`/seckill/verify/code?productId=${productId}`)
  },
  initSeckillStock: (): Promise<ApiResponse> => {
    return request.post('/seckill/init/stock')
  }
}
