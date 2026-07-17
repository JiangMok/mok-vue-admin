/**
 * 订单信息实体类型
 */
export interface OrderInfoEntity {
  id: string
  orderNo: string
  userId: string
  productId: string
  productName: string
  productPrice: number
  quantity: number
  originalAmount: number
  discountAmount: number
  payAmount: number
  orderStatus: number
  payStatus: number
  payTime?: string | null
  payType?: number | null
  transactionId?: string | null
  orderType: number
  cancelReason?: string | null
  cancelTime?: string | null
  deliveryTime?: string | null
  receiveTime?: string | null
  closeTime?: string | null
  remark?: string | null
  createTime: string
  updateTime: string
  skuDesc?: string
  receiverName?: string
  receiverPhone?: string
  receiverAddress?: string
  deliveryCompany?: string
  deliveryNo?: string
}
