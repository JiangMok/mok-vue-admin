//api响应通用类型(后端接口返回的数据格式)
export interface ApiResponse<T = any> {
  code: number,
  msg: string,
  data: T,
  timestamp: number,
  error: boolean,
  success: boolean
}

//验证码响应
export interface CaptchaResponse {
  image: string,
  expire: number,
  key: string
}

//登录请求参数
export interface LoginParams {
  username: string,
  password: string,
  captcha: string,
  captchaKey: string
}

//登陆响应
export interface LoginResponse {
  token: string,
  refreshToken: string,
  expiresIn: number,
  tokenType: string,
  username: string,
  nickname: string,
  userId: string
}

//用户信息
export interface UserInfo {
  id: string
  username: string
  nickname: string
  phone: string
  email: string
  avatar: string | null
  status: number
  createTime: string
  updateTime: string
}

//分页响应
export interface PageResponse<T> {
  total: number,
  pageSize: number,
  pageNum: number,
  totalPages: number,
  hasNext: boolean,
  hasPrevious: boolean,
  data: T[]
}

//菜单项类型
export interface MenuItem {
  id: string
  name: string
  path: string
  component?: string
  code: string
  icon?: string
  sort?: number
  children?: MenuItem[]
}

// 添加权限相关类型
export interface ApiPermission {
  id: string
  permissionName: string
  permissionCode: string
  description: string
  type: number  // 权限类型：1菜单，2按钮，3接口
  parentId: string
  icon: string | null
  path: string | null
  component: string | null
  sort: number
  visible: number
  status: number
  isDeleted: number
  createTime: string
  updateTime: string
  children?: ApiPermission[]
}

// ================== 新增：角色类型定义（根据你的后端返回数据）==================
export interface RoleItem {
  id: string
  roleName: string          // 后端返回的角色名称字段
  roleCode: string          // 后端返回的角色编码字段
  description?: string
  sort: number
  status: number
  isDeleted: number
  createTime?: string
  updateTime?: string
  // 为了方便前端使用，我们添加转换后的字段
  name?: string             // 前端使用的角色名称（从roleName转换）
  code?: string             // 前端使用的角色编码（从roleCode转换）
}

export interface RoleFormData {
  roleName: string
  roleCode: string
  description?: string
  sort: number
  status: number
  permissionIds: string[]
  createBy:string
}

// ================== 新增：用户表单数据类型 ==================
export interface UserFormData {
  username: string
  password: string
  confirmPassword?: string
  nickname: string
  phone: string
  email: string
  avatar: string
  status: number
  roleIds: string[]
}

// ================== 新增：用户请求数据类型（提交给后端的）==================
export interface UserRequestData {
  id: string
  nickname: string
  password: string
  confirmPassword: string
  username: string
  phone: string
  email: string
  avatar: string
  status: number
  roleIds: string[]
}

//操作日志类型
export interface OperationLog {
  id: string
  title: string
  businessType: string
  method: string
  requestMethod: string
  operatorType: number
  operatorId: string
  operatorName: string
  deptName: string
  operUrl :string
  operIp: string
  operLocation: string
  operParam: string
  jsonResult: string
  status: number
  errorMsg: string
  operTime?: string
  createTime?: string
}
export interface PermissionItem {
  id: string
  permissionName: string
  permissionCode: string
  description: string
  type: number  // 1:目录, 2:菜单, 3:按钮
  parentId: string
  icon: string
  path: string
  component: string
  sort: number
  visible: number  // 0:隐藏, 1:显示
  status: number   // 0:禁用, 1:启用
  isDeleted: number // 0:正常, 1:已删除
  createTime: string
  updateTime: string
  children?: PermissionItem[]
  hasChildren?: boolean
}

export interface PermissionFormData {
  permissionName: string
  permissionCode: string
  description: string
  type: number
  parentId: string
  icon: string
  path: string
  component: string
  sort: number
  visible: number
  status: number
}


// ================== 文件管理类型定义 ==================
export interface FileItem {
  id: string
  fileId: string
  originalName: string  // 原始文件名
  storageName: string   // 存储文件名
  filePath: string      // 存储路径
  fileUrl: string       // 文件访问URL
  fileSize: number      // 文件大小（字节）
  fileType: string      // 文件类型：image, video, document, other
  mimeType: string      // MIME类型
  uploadUserId: string  // 上传用户ID
  uploadUserName?: string // 上传用户名（可能需要关联查询）
  uploadIp: string      // 上传IP
  downloadCount: number  // 下载次数
  status: number        // 状态：1-正常，0-删除
  createTime: string
  updateTime: string
  createBy?: string
  updateBy?: string
  isDeleted: number
}

export interface FileUploadResponse {
  fileId: string
  originalName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

export interface FileFormData {
  id?: string
  originalName?: string
  description?: string
  tags?: string
  businessType?: string
  businessId?: string
}
