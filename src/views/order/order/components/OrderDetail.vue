<template>
  <el-dialog
    v-model="dialogVisible"
    title="订单详情"
    width="700px"
    :before-close="handleClose"
  >
    <div class="detail-container">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订单号">
          <div class="detail-content">{{ orderData?.orderNo || '--' }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="商品信息">
          <div class="detail-content">
            <div>{{ orderData?.productName }}</div>
            <div v-if="orderData?.skuDesc">规格：{{ orderData.skuDesc }}</div>
            <div>数量：{{ orderData?.quantity }}</div>
            <div>单价：¥{{ formatPrice(orderData?.productPrice) }}</div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="金额明细">
          <div class="detail-content">
            <div>商品总额：¥{{ formatPrice(orderData?.originalAmount) }}</div>
            <div v-if="orderData?.discountAmount > 0">优惠金额：-¥{{ formatPrice(orderData?.discountAmount) }}</div>
            <div class="pay-amount">实付金额：¥{{ formatPrice(orderData?.payAmount) }}</div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="订单状态">
          <div class="detail-content">
            <el-tag :type="getOrderStatusTag(orderData?.orderStatus)">
              {{ getOrderStatusText(orderData?.orderStatus) }}
            </el-tag>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="支付状态">
          <div class="detail-content">
            <el-tag :type="getPayStatusTag(orderData?.payStatus)">
              {{ getPayStatusText(orderData?.payStatus) }}
            </el-tag>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="支付信息" v-if="orderData?.payTime">
          <div class="detail-content">
            <div>支付时间：{{ formatDateTime(orderData.payTime) }}</div>
            <div>支付方式：{{ getPayTypeText(orderData.payType) }}</div>
            <div>交易号：{{ orderData.transactionId || '--' }}</div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="收货信息" v-if="orderData?.receiverName">
          <div class="detail-content">
            <div>收货人：{{ orderData.receiverName }}</div>
            <div>联系电话：{{ orderData.receiverPhone }}</div>
            <div>收货地址：{{ orderData.receiverAddress }}</div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="物流信息" v-if="orderData?.deliveryTime">
          <div class="detail-content">
            <div>发货时间：{{ formatDateTime(orderData.deliveryTime) }}</div>
            <div>物流公司：{{ orderData.deliveryCompany || '--' }}</div>
            <div>物流单号：{{ orderData.deliveryNo || '--' }}</div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="备注">
          <div class="detail-content">{{ orderData?.remark || '无' }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="创建时间">
          <div class="detail-content">{{ formatDateTime(orderData?.createTime) }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="更新时间">
          <div class="detail-content">{{ formatDateTime(orderData?.updateTime) }}</div>
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
import { computed } from 'vue'

interface Props {
  visible: boolean
  orderData?: any
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  orderData: null
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const handleClose = () => {
  dialogVisible.value = false
}

// 复用订单列表中的格式化函数，也可以提取为公共工具
const formatPrice = (price: number) => price?.toFixed(2) ?? '0.00'

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
  } catch {
    return dateString
  }
}

const getOrderStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待付款',
    1: '待发货',
    2: '已发货',
    3: '已完成',
    4: '已取消'
  }
  return map[status] || '未知'
}

const getOrderStatusTag = (status: number) => {
  const map: Record<number, string> = {
    0: 'danger',
    1: 'warning',
    2: 'primary',
    3: 'success',
    4: 'info'
  }
  return map[status] || ''
}

const getPayStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '未支付',
    1: '支付中',
    2: '已支付',
    3: '已退款'
  }
  return map[status] || '未知'
}

const getPayStatusTag = (status: number) => {
  const map: Record<number, string> = {
    0: 'danger',
    1: 'warning',
    2: 'success',
    3: 'info'
  }
  return map[status] || ''
}

const getPayTypeText = (type: number) => {
  const map: Record<number, string> = {
    1: '微信支付',
    2: '支付宝',
    3: '银行卡'
  }
  return map[type] || '其他'
}
</script>

<style scoped>
.detail-container {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.detail-content {
  padding: 4px 0;
  min-height: 24px;
  line-height: 1.6;
}

.pay-amount {
  font-weight: 500;
  color: #ff6b35;
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
