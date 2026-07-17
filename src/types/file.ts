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
  businessType: string
}

/**
 * 文件上传响应类型
 */
export interface FileUploadResponse {
  fileId: string
  originalName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

/**
 * 文件表单数据类型
 */
export interface FileFormData {
  id?: string
  originalName?: string
  description?: string
  tags?: string
  businessType?: string
  businessId?: string
}
