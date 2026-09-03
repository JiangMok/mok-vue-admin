import request from "@/utils/request.ts"
import type { AxiosRequestConfig } from 'axios'
import type { ApiResponse, CaptchaResponse, LoginParams, LoginResponse } from '@/types'

interface AuthRequestConfig extends AxiosRequestConfig {
  _authSessionId?: string
  _authLockHeld?: boolean
}

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
  login: (data: LoginParams): Promise<ApiResponse<LoginResponse>> => {
    return request.post(`/auth/login`, data)
  },
  logout: (refreshToken: string, authSessionId: string,
           authLockHeld = false): Promise<ApiResponse> => {
    const config: AuthRequestConfig = {
      _authSessionId: authSessionId,
      _authLockHeld: authLockHeld
    }
    return request.post(`/auth/logout`, { refreshToken }, config)
  },
  refreshToken: (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
    return request.post('/auth/refresh', { refreshToken })
  }
}
