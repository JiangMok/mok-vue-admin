import request from "@/utils/request.ts"
import type { ApiResponse, FileItem, FileUploadResponse, PageResponse } from '@/types'

/**
 * 文件管理API
 */
export const fileApi = {
  getPage: (params: {
    pageNum: number
    pageSize: number
    keyword?: string
    params: {
      fileType?: string
      uploadUserId?: string
      startTime?: string
      endTime?: string
    }
  }): Promise<ApiResponse<PageResponse<FileItem>>> => {
    return request.post('/files/page', params)
  },
  getFileDetail: (fileId: string): Promise<ApiResponse<FileItem>> => {
    return request.get(`/files/${fileId}`)
  },
  deleteFile: (fileId: string): Promise<ApiResponse> => {
    return request.delete(`/files/delete/${fileId}`)
  },
  batchDelete: (ids: string[]): Promise<ApiResponse> => {
    return request.delete('/files/batchDelete', { data: { ids } })
  },
  upload: (file: File): Promise<ApiResponse<FileUploadResponse>> => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  download: (id: string): Promise<Blob> => {
    return request.get(`/files/download/${id}`, {
      responseType: 'blob'
    })
  }
}
