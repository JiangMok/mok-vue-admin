/**
 * 验证码响应
 */
export interface CaptchaResponse {
  image: string
  expire: number
  key: string
}

/**
 * 登录请求参数
 */
export interface LoginParams {
  username: string
  password: string
  captcha: string
  captchaKey: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  username: string
  nickname: string
  userId: string
  avatar: string
  roles: string[]
}
