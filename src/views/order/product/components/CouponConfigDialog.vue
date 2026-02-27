<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="1100px"
    destroy-on-close
    append-to-body
    @closed="handleClosed"
  >
    <div class="coupon-config-container">
      <!-- 左侧：可搜索的优惠券列表 -->
      <div class="left-panel">
        <div class="search-wrapper">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索优惠券名称"
            clearable
            @input="debouncedSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <el-table
          ref="leftTableRef"
          :data="leftList"
          v-loading="leftLoading"
          border
          stripe
          row-key="id"
          max-height="400"
        >
          <!-- 自定义复选框列，完全由 selectedIds 控制 -->
          <el-table-column label="选择" width="55" fixed="left">
            <template #default="{ row }">
              <el-checkbox
                :model-value="selectedIds.has(row.id)"
                @change="(val) => handleCheckboxChange(row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="couponName" label="优惠券名称" min-width="150" show-overflow-tooltip />
          <el-table-column label="类型" width="80">
            <template #default="{ row }">
              {{ getCouponTypeText(row.couponType) }}
            </template>
          </el-table-column>
          <el-table-column label="优惠内容" width="150">
            <template #default="{ row }">
              {{ formatDiscountContent(row) }}
            </template>
          </el-table-column>
          <el-table-column label="库存" width="100">
            <template #default="{ row }">
              <span>{{ row.remainingQuantity }}/{{ row.totalQuantity }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="perLimit" label="每人限领" width="90">
            <template #default="{ row }">
              {{ row.perLimit === 0 ? '不限' : `${row.perLimit}张` }}
            </template>
          </el-table-column>
          <el-table-column label="有效期" width="200">
            <template #default="{ row }">
              {{ formatDate(row.startTime) }} ~ {{ formatDate(row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="70">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '有效' : '无效' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="leftPage.pageNum"
            v-model:page-size="leftPage.pageSize"
            :total="leftPage.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <!-- 右侧：已选优惠券列表（基于 selectedIds 和缓存渲染） -->
      <div class="right-panel">
        <div class="right-header">
          <span class="selected-title">已选优惠券 ({{ selectedIds.size }})</span>
          <el-button type="primary" link @click="clearAllSelections" :disabled="selectedIds.size === 0">
            清空
          </el-button>
        </div>
        <div class="selected-list" v-loading="rightLoading">
          <el-empty v-if="selectedIds.size === 0" description="暂无选择" />
          <el-scrollbar max-height="350">
            <div v-for="couponId in Array.from(selectedIds)" :key="couponId" class="selected-item">
              <div class="item-info">
                <div class="item-name">{{ getCouponNameFromCache(couponId) }}</div>
                <div class="item-type">{{ getCouponTypeFromCache(couponId) }}</div>
              </div>
              <el-button type="danger" :icon="Remove" circle size="small" @click="removeSelection(couponId)" />
            </div>
          </el-scrollbar>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Remove } from '@element-plus/icons-vue'
import { couponApi, productApi } from '@/api/index.ts'
import { debounce } from 'lodash-es'

interface CouponItem {
  id: string
  couponName: string
  couponType: 1 | 2 | 3
  thresholdAmount?: number
  discountAmount?: number
  discountRate?: number
  totalQuantity: number
  remainingQuantity: number
  perLimit: number
  startTime: string
  endTime: string
  status: 1 | 0
}

const props = defineProps<{
  visible: boolean
  productId?: string
  productName?: string
}>()

const emit = defineEmits(['update:visible', 'success'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const dialogTitle = computed(() => {
  return props.productName ? `配置商品优惠券 - ${props.productName}` : '配置商品优惠券'
})

// 缓存所有加载过的优惠券详情（用于右侧展示）
const couponDetailCache = ref<Map<string, CouponItem>>(new Map())

const getCouponNameFromCache = (id: string) => {
  return couponDetailCache.value.get(id)?.couponName || '未知优惠券'
}
const getCouponTypeFromCache = (id: string) => {
  const item = couponDetailCache.value.get(id)
  return item ? getCouponTypeText(item.couponType) : '--'
}

// 左侧表格数据
const leftTableRef = ref<any>(null) // 保留 ref 以便后续可能需要（但不再用于选择）
const leftList = ref<CouponItem[]>([])
const leftLoading = ref(false)
const leftPage = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})
const searchKeyword = ref('')

const debouncedSearch = debounce(() => {
  leftPage.pageNum = 1
  fetchLeftList()
}, 300)

const fetchLeftList = async () => {
  if (!props.productId) return
  leftLoading.value = true
  try {
    const params = {
      pageNum: leftPage.pageNum,
      pageSize: leftPage.pageSize,
      params: {
        couponName: searchKeyword.value || undefined
      }
    }
    const res = await couponApi.getPage(params)
    if (res.success) {
      leftPage.total = res.data.total || 0
      leftList.value = res.data.data || []
      // 将当前页的券加入缓存
      leftList.value.forEach(coupon => {
        couponDetailCache.value.set(coupon.id, coupon)
      })
    } else {
      ElMessage.error(res.msg || '获取优惠券列表失败')
      leftList.value = []
    }
  } catch (error) {
    // console.error('获取优惠券列表失败:', error)
    ElMessage.error('获取优惠券列表失败')
    leftList.value = []
  } finally {
    leftLoading.value = false
  }
}

const handleSizeChange = (size: number) => {
  leftPage.pageSize = size
  leftPage.pageNum = 1
  fetchLeftList()
}
const handlePageChange = (page: number) => {
  leftPage.pageNum = page
  fetchLeftList()
}

// 已选优惠券 ID 集合（唯一数据源）
const selectedIds = ref<Set<string>>(new Set())
const rightLoading = ref(false)

// 获取商品已关联的优惠券
const fetchSelectedCoupons = async () => {
  if (!props.productId) return
  rightLoading.value = true
  try {
    const res = await productApi.getCoupons(props.productId)
    if (res.success) {
      const list: CouponItem[] = res.data || []
      // console.log('已选券列表', list)
      // 构造 Set
      const ids = new Set(list.map(c => c.id))
      selectedIds.value = ids
      // 存入缓存
      list.forEach(coupon => {
        couponDetailCache.value.set(coupon.id, coupon)
      })
    } else {
      ElMessage.error(res.msg || '获取已选优惠券失败')
    }
  } catch (error) {
    // console.error('获取已选优惠券失败:', error)
    ElMessage.error('获取已选优惠券失败')
  } finally {
    rightLoading.value = false
  }
}

// 处理复选框变化（用户勾选/取消勾选）
const handleCheckboxChange = (row: CouponItem, checked: boolean) => {
  // 由于 Set 是响应式的，需要重新赋值才能触发视图更新
  const newSet = new Set(selectedIds.value)
  if (checked) {
    newSet.add(row.id)
    couponDetailCache.value.set(row.id, row) // 更新缓存
  } else {
    newSet.delete(row.id)
  }
  selectedIds.value = newSet
}

// 右侧移除某项
const removeSelection = (couponId: string) => {
  const newSet = new Set(selectedIds.value)
  newSet.delete(couponId)
  selectedIds.value = newSet
}

// 清空所有已选
const clearAllSelections = () => {
  ElMessageBox.confirm('确定清空所有已选优惠券吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    selectedIds.value = new Set()
  }).catch(() => {})
}

// 保存
const saving = ref(false)
const handleSave = async () => {
  if (!props.productId) {
    ElMessage.warning('商品ID不存在')
    return
  }
  const couponIds = Array.from(selectedIds.value)
  saving.value = true
  try {
    const params = {
      productId :props.productId,
      couponIds :couponIds
    }
    const res = await couponApi.saveProductCoupons(params)
    if (res.success) {
      ElMessage.success('配置成功')
      emit('success')
      dialogVisible.value = false
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (error) {
    // console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 对话框关闭后的清理
const handleClosed = () => {
  searchKeyword.value = ''
  leftPage.pageNum = 1
  leftPage.pageSize = 10
  leftList.value = []
  selectedIds.value = new Set()
  couponDetailCache.value.clear()
}

// 监听对话框打开，加载数据
watch(() => props.visible, async (val) => {
  if (val && props.productId) {
    await Promise.all([fetchSelectedCoupons(), fetchLeftList()])
  }
}, { immediate: false })

// 工具函数
const getCouponTypeText = (type: number) => {
  const map: Record<number, string> = {
    1: '满减券',
    2: '折扣券',
    3: '无门槛券'
  }
  return map[type] || '未知'
}

const formatDiscountContent = (row: CouponItem) => {
  if (row.couponType === 1 && row.thresholdAmount && row.discountAmount) {
    return `满${formatPrice(row.thresholdAmount)}减${formatPrice(row.discountAmount)}`
  } else if (row.couponType === 2 && row.discountRate) {
    return `${row.discountRate}折`
  } else if (row.couponType === 3 && row.discountAmount) {
    return `无门槛减${formatPrice(row.discountAmount)}`
  }
  return '--'
}

const formatPrice = (price: number) => {
  return price?.toFixed(2) ?? '0.00'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-')
}
</script>

<style scoped>
.coupon-config-container {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

.left-panel {
  flex: 2;
  min-width: 0;
}

.search-wrapper {
  margin-bottom: 16px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.right-panel {
  flex: 1;
  min-width: 250px;
  border-left: 1px solid #ebeef5;
  padding-left: 16px;
}

.right-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 500;
}

.selected-title {
  font-size: 14px;
  color: #333;
}

.selected-list {
  height: 400px;
  overflow-y: auto;
}

.selected-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.item-info {
  flex: 1;
  overflow: hidden;
}

.item-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-type {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
</style>
