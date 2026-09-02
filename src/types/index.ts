/**
 * 类型定义统一入口 — re-export 所有模块
 *
 * 使用方式（向后兼容）：
 *   import type { UserInfo, DeptItem, ApiResponse } from '@/types'
 */

export type { ApiResponse, PageResponse } from './common'
export type { CaptchaResponse, LoginParams, LoginResponse } from './auth'
export type { UserInfo, ProfileUserInfo, UserFormData, UserRequestData, PasswordUpdateRequest } from './user'
export type { RoleItem, RoleFormData } from './role'
export type { ApiPermission, MenuItem, PermissionItem, PermissionFormData, PermissionTreeNode } from './permission'
export type { DeptItem } from './dept'
export type { FileItem, FileUploadResponse } from './file'
export type { OperationLog } from './operation-log'
export type { MailSender, MailRecipient, MailSenderFormData, MailRecipientFormData, MailLog } from './mail'
export type { MqFailedMessage } from './mq'
export type { AiSystemPromptConfig, AiSystemPromptConfigFormData } from './aiPrompt'
