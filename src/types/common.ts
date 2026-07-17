/**
 * API响应通用类型（后端接口返回的数据格式）
 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
  timestamp: number
  error: boolean
  success: boolean
}

/**
 * 分页响应
 */
export interface PageResponse<T> {
  total: number
  pageSize: number
  pageNum: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  data: T[]
}
