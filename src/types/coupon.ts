/**
 * 优惠券项类型
 */
export interface CouponItem {
  id: string
  couponName: string
  couponType: number
  thresholdAmount?: number | null
  discountAmount?: number | null
  discountRate?: number | null
  totalQuantity: number
  remainingQuantity: number
  perLimit: number
  startTime: string
  endTime: string
  status: number
  version: number
  createTime: string
  updateTime: string
}

/**
 * 优惠券表单数据类型
 */
export interface CouponFormData {
  id?: string
  couponName: string
  couponType: number
  thresholdAmount?: number | null
  discountAmount?: number | null
  discountRate?: number | null
  totalQuantity: number
  remainingQuantity?: number
  perLimit: number
  startTime: string
  endTime: string
  status: number
}
