import request from "@/utils/request.ts"
import type { ApiResponse, CaptchaResponse, LoginParams, LoginResponse } from '@/types'

/**
 * 验证码API
 */
export const captchaApi = {
  getCaptcha: (): Promise<ApiResponse<CaptchaResponse>> => {
    return request.get('/captcha/generate')
  }
}

/**
 * 认证API
 */
export const authApi = {
  login: (data: LoginParams): Promise<ApiResponse<LoginParams>> => {
    return request.post(`/auth/login`, data)
  },
  logout: (): Promise<ApiResponse> => {
    return request.post(`/auth/logout`)
  },
  refreshToken: (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
    return request.post(`/auth/refresh?refreshToken=${refreshToken}`)
  }
}
