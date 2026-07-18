/**
 * API 统一入口 — re-export 所有模块
 *
 * 使用方式（向后兼容）：
 *   import { userApi, deptApi } from '@/api'
 */

export { captchaApi, authApi } from './modules/auth'
export { userApi } from './modules/user'
export { roleApi } from './modules/role'
export { menuApi, permissionApi } from './modules/permission'
export { deptApi } from './modules/dept'
export { fileApi } from './modules/file'
export { sysInfoApi, operationLogApi } from './modules/monitor'
export { productApi } from './modules/product'
export { couponApi } from './modules/coupon'
export { orderApi } from './modules/order'
export { seckillApi } from './modules/seckill'
export { deliveryApi } from './modules/delivery'
export { mailSenderApi, mailRecipientApi, mailLogApi } from './modules/mail'
export { mqFailedMessageApi } from './modules/mq'
