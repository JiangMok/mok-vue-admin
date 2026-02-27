<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="900px"
    destroy-on-close
    @closed="handleClosed"
  >
    <!-- 加载状态 -->
    <div v-loading="loading" class="coupon-loading">
      <!-- 空状态 -->
      <el-empty v-if="!loading && couponList.length === 0" description="暂无可用优惠券" />

      <!-- 优惠券表格 -->
      <el-table
        v-else
        :data="couponList"
        border
        stripe
        style="width: 100%"
        :max-height="400"
      >
        <el-table-column prop="couponName" label="优惠券名称" min-width="150" show-overflow-tooltip />

        <el-table-column label="优惠类型" width="100">
          <template #default="{ row }">
            {{ getCouponTypeText(row.couponType) }}
          </template>
        </el-table-column>

        <el-table-column label="优惠内容" width="150">
          <template #default="{ row }">
            <span v-if="row.couponType === 1 && row.thresholdAmount">
              满{{ formatPrice(row.thresholdAmount) }}减{{ formatPrice(row.discountAmount) }}
            </span>
            <span v-else-if="row.couponType === 2 && row.discountRate">
              {{ row.discountRate }}折
            </span>
            <span v-else-if="row.couponType === 3">
              无门槛 ¥{{ formatPrice(row.discountAmount) }}
            </span>
            <span v-else>--</span>
          </template>
        </el-table-column>

        <el-table-column label="库存" width="100">
          <template #default="{ row }">
            <span>总 {{ row.totalQuantity || 0 }}</span><br>
            <span style=" color: #67c23a;">剩 {{ row.remainingQuantity || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="perLimit" label="每人限领" width="100">
          <template #default="{ row }">
            {{ row.perLimit === 0 ? '不限' : `${row.perLimit}张` }}
          </template>
        </el-table-column>

        <el-table-column label="有效期" width="140">
          <template #default="{ row }">
            {{ formatDate(row.startTime) }}
            <br> 至 <br>
            {{ formatDate(row.endTime) }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '有效' : '无效' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { productApi } from '@/api' // 假设已有获取优惠券的API

const props = defineProps<{
  visible: boolean
  productId?: string
  productName?: string
}>()

const emit = defineEmits(['update:visible'])

// 对话框显隐控制（双向绑定）
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 对话框标题
const dialogTitle = computed(() => {
  return props.productName ? `${props.productName} - 商品优惠券` : '商品优惠券'
})

// 优惠券列表
const couponList = ref<any[]>([])
const loading = ref(false)

// 监听 visible 变化，打开时加载数据
watch(() => props.visible, (val) => {
  if (val && props.productId) {
    fetchCouponList()
  }
}, { immediate: false })

// 获取优惠券列表
const fetchCouponList = async () => {
  if (!props.productId) return
  loading.value = true
  try {
    const res = await productApi.getCoupons(props.productId)// 需要您在 productApi 中定义该方法
    // 假设接口返回格式如您提供的示例
    if (res.data) {
      couponList.value = res.data || []
    } else {
      ElMessage.error(res.msg || '获取优惠券失败')
      couponList.value = []
    }
  } catch (error) {
    // console.error('获取优惠券失败:', error)
    ElMessage.error('获取优惠券失败')
    couponList.value = []
  } finally {
    loading.value = false
  }
}

// 对话框关闭回调
const handleClosed = () => {
  couponList.value = [] // 清空数据，下次打开重新加载
}

// 工具函数：优惠券类型文字
const getCouponTypeText = (type: number) => {
  const map: Record<number, string> = {
    1: '满减券',
    2: '折扣券',
    3: '无门槛券'
  }
  return map[type] || '未知'
}

// 格式化金额
const formatPrice = (price: number) => {
  if (price === undefined || price === null) return '0.00'
  return price.toFixed(2)
}

// 格式化日期时间
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-')
}
</script>

<style scoped>
.coupon-loading {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
