import request from "@/utils/request.ts";
import type {
  ApiPermission,
  ApiResponse,
  CaptchaResponse, FileItem, FileUploadResponse,
  LoginParams,
  LoginResponse,
  MenuItem,
  OperationLog,
  PageResponse,
  RoleItem,
  UserInfo
} from '@/types'

/**
 * 获取验证码
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
  //登录
  login: (data: LoginParams): Promise<ApiResponse<LoginParams>> => {
    return request.post(`/auth/login`, data)
  },
  //登出
  logout: (): Promise<ApiResponse> => {
    return request.post(`/auth/logout`)
  },
  //刷新token
  refreshToken: (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
    return request.post(`/auth/refresh?refreshToken=${refreshToken}`)
  }
}

/**
 * 用户管理API
 */
export const userApi = {
  // 获取用户列表（分页）
  getUsers: (params: {
    pageNum: number
    pageSize: number
    username?: string
  }): Promise<ApiResponse<PageResponse<UserInfo>>> => {
    return request.post('/user/page', params)
  },
  getUserById: (id: string): Promise<ApiResponse<UserInfo>> => {
    return request.get(`/user/${id}`)
  },

  // 添加用户
  addUser: (data: Partial<UserInfo>) => {
    return request.post('/user/add', data)
  },

  // 更新用户
  updateUser: (data: Partial<UserInfo>) => {
    return request.post('/user/update', data)
  },

  // 更改密码
  updateUserPwd: (data: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> => {
    return request.post('/user/updatePwd', data)
  },

  // 重置密码
  resetPwd: (id: string): Promise<ApiResponse> => {
    return request.put(`/user/resetPwd/${id}`)
  },
  // 删除用户
  deleteUser: (id: string) => {
    return request.delete(`/user/delete/${id}`)
  }
}

// 菜单API（动态路由来源）
export const menuApi = {
  // 获取用户菜单
  getUserMenus: (): Promise<ApiResponse<MenuItem[]>> => {
    return request.get('/permission/my-menus') // 假设这是你的菜单接口
  }
}

// 添加权限API
export const permissionApi = {
  // 获取角色分页列表
  getPage: (params: {
    pageNum: number
    pageSize: number
    roleName?: string
  }): Promise<ApiResponse<PageResponse<RoleItem>>> => {
    return request.post('/permission/page', params)
  },
  // 获取用户API权限列表
  getUserApiPermissions: (): Promise<ApiResponse<ApiPermission[]>> => {
    return request.get('/permission/apis')
  },
  getByRoleId: (roleId: string): Promise<ApiResponse<ApiPermission[]>> => {
    return request.get(`/permission/getByRoleId/${roleId}`)
  },
  getByUserId: (): Promise<ApiResponse<ApiPermission[]>> => {
    return request.get('/permission/getByUserId')
  },
  delete: (id: string) => {
    return request.delete(`/permission/delete/${id}`)
  },
  // 新增权限
  add(data: ApiPermission) {
    return request.post('/permission/add', data)
  },

  // 更新权限
  update(data: ApiPermission & { id: string }) {
    return request.put(`/permission/update`, data)
  },
}


// 角色管理API
export const roleApi = {
  // 获取所有角色列表（用于下拉选择）
  getAllRoles: (): Promise<ApiResponse<RoleItem[]>> => {
    return request.get('/role/all')
  },
  getUserRoles: (userId: string): Promise<ApiResponse<RoleItem[]>> => {
    return request.get(`/role/user/${userId}`)
  },
  // 获取角色分页列表
  getPage: (params: {
    pageNum: number
    pageSize: number
    roleName?: string
  }): Promise<ApiResponse<PageResponse<RoleItem>>> => {
    return request.post('/role/page', params)
  },

  // 添加角色
  addRole: (data: {
    roleName: string
    roleCode: string
    description?: string
    sort?: number
    status?: number
  }) => {
    return request.post('/role/add', data)
  },

  // 更新角色
  updateRole: (data: {
    id: string
    roleName?: string
    roleCode?: string
    description?: string
    sort?: number
    status?: number
  }) => {
    return request.put('/role/update', data)
  },

  // 删除角色
  delete: (id: string) => {
    return request.delete(`/role/delete/${id}`)
  },

  // 批量删除角色
  deleteRoles: (ids: string[]) => {
    return request.delete('/system/role/batchDelete', {data: {ids}})
  }
}


/**
 * 系统信息API
 */
export const sysInfoApi = {
  //健康状态
  health: (): Promise<ApiResponse> => {
    return request.get(`/system/health`)
  },
  //系统信息
  info: (): Promise<ApiResponse> => {
    return request.get(`/system/info`)
  }
}

/**
 * 操作日志API
 */
export const operationLogApi = {
  // 获取列表（分页）
  getPage: (params: {
    pageNum: number
    pageSize: number
  }): Promise<ApiResponse<PageResponse<OperationLog>>> => {
    return request.post('/operation-log/page', params)
  },
  getOperationLogById: (id: string): Promise<ApiResponse<OperationLog>> => {
    return request.get(`/operation-log/${id}`)
  },
  delete: (id: string) => {
    return request.delete(`/operation-log/delete/${id}`)
  },
  cleanBefore: (time: string): Promise<ApiResponse> => {
    return request.delete(`operation-log/clean?beforeDate=${time}`)
  }
}

/**
 * 文件管理API
 */
export const fileApi = {
  // 获取文件列表（分页）- 使用POST请求，与现有系统保持一致
  getPage: (params: {
    pageNum: number
    pageSize: number
    params:{
      keyword?: string
      fileType?: string
      uploadUserId?: string
      startTime?: string
      endTime?: string
    }
  }): Promise<ApiResponse<PageResponse<FileItem>>> => {
    return request.post('/files/page', params)
  },
// 获取文件详情 - GET请求
  getFileDetail: (fileId: string): Promise<ApiResponse<FileItem>> => {
    return request.get(`/files/${fileId}`)
  },

  // 删除文件 - DELETE请求
  deleteFile: (fileId: string): Promise<ApiResponse> => {
    return request.delete(`/files/delete/${fileId}`)
  },

  // 批量删除文件 - DELETE请求
  batchDelete: (ids: string[]): Promise<ApiResponse> => {
    return request.delete('/files/batchDelete', { data: { ids } })
  },

  // 上传文件 - POST请求，FormData格式
  upload: (formData: FormData): Promise<ApiResponse<FileUploadResponse>> => {
    return request.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 下载文件 - GET请求，返回blob
  download: (fileId: string): Promise<Blob> => {
    return request.get(`/files/download/${fileId}`, {
      responseType: 'blob'
    })
  },

  // 更新下载次数 - PUT请求
  updateDownloadCount: (fileId: string): Promise<ApiResponse> => {
    return request.put(`/files/updateDownloadCount/${fileId}`)
  }
}

