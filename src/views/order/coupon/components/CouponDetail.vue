<template>
  <el-dialog
    v-model="dialogVisible"
    title="优惠券详情"
    width="700px"
    :before-close="handleClose"
  >
    <div class="detail-container">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="优惠券名称">
          {{ detailData.couponName || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="优惠券类型">
          <el-tag :type="getTypeTagType(detailData.couponType)">
            {{ getTypeText(detailData.couponType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优惠内容">
          <span v-if="detailData.couponType === 1">
            满￥{{ detailData.thresholdAmount }} 减 ￥{{ detailData.discountAmount }}
          </span>
          <span v-else-if="detailData.couponType === 2">
            {{ detailData.discountRate }}折
          </span>
          <span v-else-if="detailData.couponType === 3">
            ￥{{ detailData.discountAmount }} (无门槛)
          </span>
          <span v-else>--</span>
        </el-descriptions-item>
        <el-descriptions-item label="使用门槛">
          {{ detailData.thresholdAmount ? `满￥${detailData.thresholdAmount}` : '无门槛' }}
        </el-descriptions-item>
        <el-descriptions-item label="总发放量">
          {{ detailData.totalQuantity || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="剩余量">
          {{ detailData.remainingQuantity || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="每人限领">
          {{ detailData.perLimit || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="有效期">
          {{ formatDate(detailData.startTime) }} ~ {{ formatDate(detailData.endTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'">
            {{ detailData.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="版本号">
          {{ detailData.version || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(detailData.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatDate(detailData.updateTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
    <template #footer>
      <el-button type="primary" @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { CouponItem } from '@/types/index.ts'

interface Props {
  visible: boolean
  tableData?: CouponItem | null
}
interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  tableData: null
})
const emit = defineEmits<Emits>()

const detailData = reactive<Partial<CouponItem>>({})

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 类型映射（复用）
const getTypeText = (type?: number) => {
  const map: Record<number, string> = { 1: '满减券', 2: '折扣券', 3: '立减券' }
  return type ? map[type] || '未知' : '--'
}
const getTypeTagType = (type?: number) => {
  const map: Record<number, string> = { 1: 'primary', 2: 'success', 3: 'warning' }
  return type ? map[type] || 'info' : 'info'
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '--'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return dateStr
  }
}

// 初始化详情数据
const initDetailData = () => {
  if (props.tableData) {
    Object.assign(detailData, props.tableData)
  }
}

const handleClose = () => {
  dialogVisible.value = false
  // 重置数据
  Object.keys(detailData).forEach(key => delete detailData[key])
}

watch(() => props.visible, (val) => {
  if (val) initDetailData()
})
watch(() => props.tableData, () => {
  if (dialogVisible.value) initDetailData()
}, { deep: true })
</script>

<style scoped>
.detail-container {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}
.detail-container::-webkit-scrollbar {
  width: 6px;
}
.detail-container::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 3px;
}
:deep(.el-descriptions__label) {
  width: 100px;
  font-weight: 500;
}
</style>
