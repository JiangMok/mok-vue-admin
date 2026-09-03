/**
 * 发件箱配置类型
 */
export interface MailSender {
  id: string
  host: string
  port: number
  sslEnable: number
  fromAddress: string
  username: string
  status: number
  createTime?: string
  updateTime?: string
}

/**
 * 收件人类型
 */
export interface MailRecipient {
  id: string
  email: string
  name: string
  status: number
  mailTypes?: string[]
  createTime?: string
  updateTime?: string
}

/**
 * 发件箱表单数据
 */
export interface MailSenderFormData {
  id?: string
  host: string
  port: number
  sslEnable: number
  fromAddress: string
  username: string
  password?: string
  status: number
}

/**
 * 收件人表单数据
 */
export interface MailRecipientFormData {
  id?: string
  email: string
  name: string
  status: number
  mailTypes: string[]
}

/**
 * 邮件日志类型
 */
export interface MailLog {
  id: string
  messageId: string
  recipient: string
  subject: string
  mailType: string
  content: string
  sendStatus: string
  failReason: string
  sendTime?: string
  retryCount: number
  createTime?: string
  updateTime?: string
}
