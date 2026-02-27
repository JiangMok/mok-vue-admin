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
  userId: string,
  avatar: string
}

export interface ProfileUserInfo{
  roleIds :string []
  user : UserInfo
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
  id?: string
  password?: string
  confirmPassword?: string
  nickname: string
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
  id?:string
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
  businessType: string

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

export interface ProductItem {
  id: string
  productName: string
  productDesc: string
  price: number
  stock: number
  seckillPrice?: number
  seckillStock?: number
  seckillStartTime?: string
  seckillEndTime?: string
  status: number
  version: number
  createTime: string
  updateTime: string
  imageUrl?: string
}

export interface ProductFormData {
  id: string
  productName: string
  productDesc: string
  price: number
  stock: number
  status: number
  imageUrl?: string
}

export interface SeckillFormData {
  seckillPrice: number
  seckillStock: number
  seckillStartTime: string
  seckillEndTime: string
}

export interface ProductListParams {
  pageNum?: number
  pageSize?: number
  productName?: string
  status?: number
  minPrice?: number
  maxPrice?: number
  minStock?: number
  maxStock?: number
}

export interface CouponItem {
  id: string;
  couponName: string;           // 优惠券名称
  couponType: number;           // 1-满减券 2-折扣券 3-立减券
  thresholdAmount?: number | null; // 使用门槛（满减券必填）
  discountAmount?: number | null; // 优惠金额（满减券/立减券）
  discountRate?: number | null;   // 折扣率（如85表示8.5折）
  totalQuantity: number;        // 总发放量
  remainingQuantity: number;    // 剩余量
  perLimit: number;            // 每人限领
  startTime: string;           // 开始时间
  endTime: string;            // 结束时间
  status: number;             // 0-禁用 1-启用
  version: number;
  createTime: string;
  updateTime: string;
}

// 新增/编辑表单数据结构（编辑时包含id）
export interface CouponFormData {
  id?: string;
  couponName: string;
  couponType: number;
  thresholdAmount?: number | null;
  discountAmount?: number | null;
  discountRate?: number | null;
  totalQuantity: number;
  remainingQuantity?: number; // 新增时可忽略，后端自动设置
  perLimit: number;
  startTime: string;
  endTime: string;
  status: number;
}

// types/order.ts

/**
 * 订单信息实体
 */
export interface OrderInfoEntity {
  /** 订单ID */
  id: string;
  /** 订单号 */
  orderNo: string;
  /** 用户ID */
  userId: string;
  /** 商品ID */
  productId: string;
  /** 商品名称 */
  productName: string;
  /** 商品单价 */
  productPrice: number;
  /** 购买数量 */
  quantity: number;
  /** 订单原价总额 */
  originalAmount: number;
  /** 优惠金额 */
  discountAmount: number;
  /** 实付金额 */
  payAmount: number;
  /** 订单状态：0待付款 1待发货 2已发货 3已完成 4已取消 */
  orderStatus: number;
  /** 支付状态：0未支付 1支付中 2已支付 3已退款 */
  payStatus: number;
  /** 支付时间 */
  payTime?: string | null;
  /** 支付方式：1微信 2支付宝 3银行卡 */
  payType?: number | null;
  /** 支付交易号 */
  transactionId?: string | null;
  /** 订单类型：0普通 1秒杀 */
  orderType: number;
  /** 取消原因 */
  cancelReason?: string | null;
  /** 取消时间 */
  cancelTime?: string | null;
  /** 发货时间 */
  deliveryTime?: string | null;
  /** 收货时间 */
  receiveTime?: string | null;
  /** 关闭时间 */
  closeTime?: string | null;
  /** 订单备注 */
  remark?: string | null;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;

  // ========== 以下字段可能仅在详情接口返回 ==========
  /** 商品规格描述（如颜色、尺寸） */
  skuDesc?: string;
  /** 收货人姓名 */
  receiverName?: string;
  /** 收货人电话 */
  receiverPhone?: string;
  /** 收货地址 */
  receiverAddress?: string;
  /** 物流公司 */
  deliveryCompany?: string;
  /** 物流单号 */
  deliveryNo?: string;
}


/**
 * 发货单实体
 */
export interface DeliveryOrderEntity {
  id: string;
  deliveryNo: string;
  orderId: string;
  orderNo: string;
  userId: string;
  productId: string;
  productName: string;
  quantity: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  deliveryStatus: number; // 0待发货 1已发货 2已收货
  deliveryCompany?: string;
  deliveryNumber?: string;
  deliveryTime?: string | null;
  receiveTime?: string | null;
  remark?: string | null;
  createTime: string;
  updateTime: string;
}
