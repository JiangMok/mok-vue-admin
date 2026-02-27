<template>
  <el-dialog
    v-model="dialogVisible"
    title="商品详情"
    width="700px"
    :before-close="handleClose"
  >
    <div class="detail-container">
      <div class="product-header">
        <div class="product-title">
          <h3>{{ detailData.productName }}</h3>
          <div class="product-status">
            <el-tag :type="detailData.status === 1 ? 'success' : 'danger'" size="small">
              {{ detailData.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </div>
        </div>
        <div class="product-desc" v-if="detailData.productDesc">
          {{ detailData.productDesc }}
        </div>
      </div>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="商品ID">
          <div class="detail-content">
            {{ detailData.id || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="商品价格">
          <div class="detail-content">
            <span class="price-display">¥{{ formatPrice(detailData.price) }}</span>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="库存数量">
          <div class="detail-content">
            <el-tag :type="getStockTagType(detailData.stock)">
              {{ detailData.stock || 0 }}
            </el-tag>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="秒杀信息" v-if="detailData.seckillPrice && detailData.seckillPrice > 0">
          <div class="detail-content">
            <div class="seckill-detail">
              <div class="seckill-price-info">
                <span class="original-price">原价: ¥{{ formatPrice(detailData.price) }}</span>
                <span class="seckill-price">秒杀价: ¥{{ formatPrice(detailData.seckillPrice) }}</span>
              </div>
              <div class="seckill-stock-info">
                秒杀库存: <el-tag size="small" :type="getStockTagType(detailData.seckillStock)">{{ detailData.seckillStock || 0 }}</el-tag>
              </div>
              <div class="seckill-time-info">
                <div>开始时间: {{ formatDateTime(detailData.seckillStartTime) }}</div>
                <div>结束时间: {{ formatDateTime(detailData.seckillEndTime) }}</div>
              </div>
            </div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="创建时间">
          <div class="detail-content">
            {{ formatDateTime(detailData.createTime) || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="更新时间">
          <div class="detail-content">
            {{ formatDateTime(detailData.updateTime) || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="版本号">
          <div class="detail-content">
            <el-tag type="info">{{ detailData.version || 0 }}</el-tag>
            <div class="field-tip">用于乐观锁控制</div>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

interface Props {
  visible: boolean
  productData?: any
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  productData: null
})

const emit = defineEmits<Emits>()

// 详情数据
const detailData = reactive({
  id: '',
  productName: '',
  productDesc: '',
  price: 0,
  stock: 0,
  seckillPrice: 0,
  seckillStock: 0,
  seckillStartTime: '',
  seckillEndTime: '',
  status: 1,
  version: 0,
  createTime: '',
  updateTime: ''
})

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 初始化详情数据
const initDetailData = () => {
  if (props.productData) {
    Object.assign(detailData, props.productData)
  }
}

// 获取库存标签类型
const getStockTagType = (stock: number) => {
  if (stock > 50) return 'success'
  if (stock > 10) return 'warning'
  return 'danger'
}

// 格式化价格
const formatPrice = (price: number) => {
  return price ? price.toFixed(2) : '0.00'
}

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  // 重置数据
  Object.assign(detailData, {
    id: '',
    productName: '',
    productDesc: '',
    price: 0,
    stock: 0,
    seckillPrice: 0,
    seckillStock: 0,
    seckillStartTime: '',
    seckillEndTime: '',
    status: 1,
    version: 0,
    createTime: '',
    updateTime: ''
  })
}

// 监听对话框显示状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initDetailData()
  }
})

// 监听商品数据变化
watch(() => props.productData, (newVal) => {
  if (newVal && dialogVisible.value) {
    initDetailData()
  }
}, { deep: true })
</script>

<style scoped>
.detail-container {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.product-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.product-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.product-title h3 {
  margin: 0;
  color: #333;
}

.product-desc {
  color: #666;
  line-height: 1.5;
}

.detail-content {
  padding: 4px 0;
  min-height: 24px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.price-display {
  color: #ff6b35;
  font-weight: 500;
  font-size: 16px;
}

.seckill-detail {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  width: 100%;
}

.seckill-price-info {
  display: flex;
  gap: 15px;
  margin-bottom: 8px;
}

.original-price {
  color: #999;
  text-decoration: line-through;
}

.seckill-price {
  color: #ff6b35;
  font-weight: 500;
}

.seckill-stock-info {
  margin-bottom: 8px;
}

.seckill-time-info div {
  color: #666;
  font-size: 13px;
  margin-bottom: 4px;
}

.field-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

:deep(.el-descriptions__body) {
  background-color: #fff;
}

:deep(.el-descriptions__label) {
  width: 100px;
  font-weight: 500;
}

:deep(.el-descriptions__content) {
  padding: 12px 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
