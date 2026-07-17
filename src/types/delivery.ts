/**
 * 发货单实体类型
 */
export interface DeliveryOrderEntity {
  id: string
  deliveryNo: string
  orderId: string
  orderNo: string
  userId: string
  productId: string
  productName: string
  quantity: number
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  deliveryStatus: number
  deliveryCompany?: string
  deliveryNumber?: string
  deliveryTime?: string | null
  receiveTime?: string | null
  remark?: string | null
  createTime: string
  updateTime: string
}
