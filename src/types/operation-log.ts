/**
 * 操作日志类型
 */
export interface OperationLog {
  id: string
  title: string
  businessType: string
  method: string
  requestMethod: string
  operatorType: string
  operatorId: string
  operatorName: string
  deptName: string
  operUrl: string
  operIp: string
  operLocation: string
  operParam: string
  jsonResult: string
  status: number
  errorMsg: string
  operTime?: string
  createTime?: string
}
