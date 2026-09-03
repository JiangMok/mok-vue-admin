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
  /** 前端跨标签登录操作标识，不由后端返回。 */
  authOperationId?: string
  token: string
  refreshToken: string
  expiresIn: number // access token 剩余有效期，单位：秒
  tokenType: string
  username: string
  nickname: string
  userId: string
  avatar: string
  roles: string[]
}
