/**
 * 类型定义统一入口 — re-export 所有模块
 *
 * 使用方式（向后兼容）：
 *   import type { UserInfo, DeptItem, ApiResponse } from '@/types'
 */

export type { ApiResponse, PageResponse } from './common'
export type { CaptchaResponse, LoginParams, LoginResponse } from './auth'
export type { UserInfo, ProfileUserInfo, UserFormData, UserRequestData } from './user'
export type { RoleItem, RoleFormData } from './role'
export type { ApiPermission, MenuItem, PermissionItem, PermissionFormData } from './permission'
export type { DeptItem } from './dept'
export type { FileItem, FileUploadResponse, FileFormData } from './file'
export type { OperationLog } from './operation-log'
export type { ProductItem, ProductFormData, SeckillFormData, ProductListParams } from './product'
export type { CouponItem, CouponFormData } from './coupon'
export type { OrderInfoEntity } from './order'
export type { DeliveryOrderEntity } from './delivery'
export type { MailSender, MailRecipient, MailSenderFormData, MailRecipientFormData } from './mail'
