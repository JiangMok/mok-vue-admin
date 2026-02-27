<template>
  <el-dialog
    v-model="dialogVisible"
    title="发货单详情"
    width="700px"
    :before-close="handleClose"
  >
    <div class="detail-container">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="发货单号">
          <div class="detail-content">{{ deliveryData?.deliveryNo || '--' }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="订单号">
          <div class="detail-content">{{ deliveryData?.orderNo || '--' }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="商品信息">
          <div class="detail-content">
            <div>{{ deliveryData?.productName }}</div>
            <div>数量：{{ deliveryData?.quantity }}</div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="收货信息">
          <div class="detail-content">
            <div>收货人：{{ deliveryData?.receiverName }}</div>
            <div>联系电话：{{ deliveryData?.receiverPhone }}</div>
            <div>收货地址：{{ deliveryData?.receiverAddress }}</div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="发货状态">
          <div class="detail-content">
            <el-tag :type="getStatusTag(deliveryData?.deliveryStatus)">
              {{ getStatusText(deliveryData?.deliveryStatus) }}
            </el-tag>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="物流信息" v-if="deliveryData?.deliveryCompany">
          <div class="detail-content">
            <div>物流公司：{{ deliveryData.deliveryCompany }}</div>
            <div>物流单号：{{ deliveryData.deliveryNumber }}</div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="发货时间">
          <div class="detail-content">{{ formatDateTime(deliveryData?.deliveryTime) }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="收货时间">
          <div class="detail-content">{{ formatDateTime(deliveryData?.receiveTime) }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="备注">
          <div class="detail-content">{{ deliveryData?.remark || '无' }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="创建时间">
          <div class="detail-content">{{ formatDateTime(deliveryData?.createTime) }}</div>
        </el-descriptions-item>

        <el-descriptions-item label="更新时间">
          <div class="detail-content">{{ formatDateTime(deliveryData?.updateTime) }}</div>
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
  deliveryData?: any
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  deliveryData: null
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

// 复用列表页的状态映射
const getStatusText = (status?: number) => {
  const map: Record<number, string> = {
    0: '待发货',
    1: '已发货',
    2: '已收货'
  }
  return status !== undefined ? map[status] || '未知' : '未知'
}
const getStatusTag = (status?: number) => {
  const map: Record<number, string> = {
    0: 'danger',
    1: 'warning',
    2: 'success'
  }
  return status !== undefined ? map[status] || '' : ''
}

const formatDateTime = (date: string | Date | null) => {
  if (!date) return ''
  try {
    const d = new Date(date)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return String(date)
  }
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
  line-height: 1.6;
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
