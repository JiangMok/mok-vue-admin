/**
 * MQ失败消息类型
 */
export interface MqFailedMessage {
  id: string
  messageId: string
  messageType: string
  messageBody: string
  originalQueue: string
  deadQueue: string
  dlxExchange: string
  dlxRoutingKey: string
  failReason: string
  xDeathHeader: string
  retryCount: number
  maxRetry: number
  status: string
  originalTimestamp?: string
  failedTime?: string
  resolvedBy: string
  resolvedTime?: string
  remark: string
}
