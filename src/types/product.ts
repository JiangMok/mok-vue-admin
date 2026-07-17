/**
 * 商品项类型
 */
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

/**
 * 商品表单数据类型
 */
export interface ProductFormData {
  id: string
  productName: string
  productDesc: string
  price: number
  stock: number
  status: number
  imageUrl?: string
}

/**
 * 秒杀表单数据类型
 */
export interface SeckillFormData {
  seckillPrice: number
  seckillStock: number
  seckillStartTime: string
  seckillEndTime: string
}

/**
 * 商品列表查询参数
 */
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
