import request from '@/utils/request.ts'
import type { ApiResponse, MailRecipient, MailSender, MailRecipientFormData, MailSenderFormData, PageResponse } from '@/types'

/**
 * 发件箱配置 API
 */
export const mailSenderApi = {
  getConfig: (): Promise<ApiResponse<MailSender>> => {
    return request.get('/mail-sender')
  },
  updateConfig: (data: MailSenderFormData): Promise<ApiResponse> => {
    return request.put('/mail-sender', data)
  }
}

/**
 * 收件人管理 API
 */
export const mailRecipientApi = {
  getPage: (params: {
    pageNum: number
    pageSize: number
    keyword?: string
  }): Promise<ApiResponse<PageResponse<MailRecipient>>> => {
    return request.post('/mail-recipient/page', params)
  },
  getById: (id: string): Promise<ApiResponse<MailRecipient>> => {
    return request.get(`/mail-recipient/${id}`)
  },
  create: (data: MailRecipientFormData): Promise<ApiResponse> => {
    return request.post('/mail-recipient', data)
  },
  update: (data: MailRecipientFormData & { id: string }): Promise<ApiResponse> => {
    return request.put('/mail-recipient', data)
  },
  delete: (id: string): Promise<ApiResponse> => {
    return request.delete(`/mail-recipient/${id}`)
  },
  testSend: (id: string): Promise<ApiResponse> => {
    return request.post(`/mail-recipient/test/${id}`)
  }
}
