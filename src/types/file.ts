/**
 * 文件项类型
 */
export interface FileItem {
  id: string
  originalName: string
  storageName: string
  filePath: string
  fileUrl: string
  fileSize: number
  fileType: string
  mimeType: string
  uploadUserId: string
  uploadUserName?: string
  uploadIp: string
  downloadCount: number
  status: number
  createTime: string
  updateTime: string
  createBy?: string
  updateBy?: string
  isDeleted: number
  businessType: number
}

/**
 * 文件上传响应类型
 */
export interface FileUploadResponse {
  id: string
  originalName: string
  fileUrl: string
  fileSize: number
  fileType: string
}
