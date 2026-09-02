import request from '@/utils/request.ts'
import type { ApiResponse, AiSystemPromptConfig, AiSystemPromptConfigFormData } from '@/types'

export interface MyBatisPage<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

/**
 * AI系统提示词配置 API
 */
export const aiSystemPromptConfigApi = {
  getPage: (params: {
    pageNum: number
    pageSize: number
  }): Promise<ApiResponse<MyBatisPage<AiSystemPromptConfig>>> => {
    return request.get('/ai-system-prompt-config/page', { params })
  },
  getById: (id: string): Promise<ApiResponse<AiSystemPromptConfig>> => {
    return request.get(`/ai-system-prompt-config/${id}`)
  },
  create: (data: AiSystemPromptConfigFormData): Promise<ApiResponse> => {
    return request.post('/ai-system-prompt-config', data)
  },
  update: (data: AiSystemPromptConfigFormData & { id: string }): Promise<ApiResponse> => {
    return request.put('/ai-system-prompt-config', data)
  },
  delete: (id: string): Promise<ApiResponse> => {
    return request.delete(`/ai-system-prompt-config/${id}`)
  }
}
