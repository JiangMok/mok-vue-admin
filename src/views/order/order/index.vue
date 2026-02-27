<template>
  <div class="order-manage">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-actions">
        <!-- 可根据权限添加批量操作等，这里暂不增加按钮 -->
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
        <el-form-item label="订单号">
          <el-input
            v-model="searchForm.params.orderNo"
            placeholder="请输入订单号"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input
            v-model="searchForm.params.productName"
            placeholder="请输入商品名称"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.params.orderStatus" placeholder="请选择" clearable style="width: 120px">
            <el-option label="待付款" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="searchForm.params.payStatus" placeholder="请选择" clearable style="width: 120px">
            <el-option label="未支付" :value="0" />
            <el-option label="支付中" :value="1" />
            <el-option label="已支付" :value="2" />
            <el-option label="已退款" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="searchForm.params.createTimeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <el-table
        :data="tableList"
        border
        stripe
        v-loading="loading"
        style="width: 100%"
        row-key="id"
      >
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column label="商品信息" min-width="220">
          <template #default="{ row }">
            <div class="product-info">
              <div class="product-name">{{ row.productName }}</div>
              <div class="product-sku" v-if="row.skuDesc">{{ row.skuDesc }}</div>
              <div class="product-quantity">x{{ row.quantity }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="180">
          <template #default="{ row }">
            <div class="amount-info">
              <div>原价: ¥{{ formatPrice(row.originalAmount) }}</div>
              <div v-if="row.discountAmount > 0">优惠: -¥{{ formatPrice(row.discountAmount) }}</div>
              <div class="pay-amount">实付: ¥{{ formatPrice(row.payAmount) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusTag(row.orderStatus)">
              {{ getOrderStatusText(row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getPayStatusTag(row.payStatus)">
              {{ getPayStatusText(row.payStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleDetail(row)"
              v-if="userStore.hasPermission('order:order:query')"
            >
              详情
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handlePay(row)"
              v-if="row.payStatus === 0 && userStore.hasPermission('order:order:pay')"
            >
              支付
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="handleCancel(row)"
              v-if="userStore.hasPermission('order:order:cancel')"
            >
              取消
            </el-button>
<!--            <el-button-->
<!--              type="info"-->
<!--              size="small"-->
<!--              @click="handleConfirmReceive(row)"-->
<!--              v-if="row.orderStatus === 2 && userStore.hasPermission('order:order:confirm')"-->
<!--            >-->
<!--              确认收货-->
<!--            </el-button>-->
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 详情对话框 -->
    <OrderDetail
      v-model:visible="detailDialogVisible"
      :order-data="selectedOrderData"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { orderApi} from '@/api'  // 假设订单API已定义
import type { OrderInfoEntity } from '@/types'
import OrderDetail from '@/views/order/order/components/OrderDetail.vue'

const userStore = useUserStore()

// 加载状态
const loading = ref(false)

// 订单列表
const tableList = ref<OrderInfoEntity[]>([])

// 搜索表单
const searchForm = reactive({
  params: {
    orderNo: '',
    productName: '',
    orderStatus: undefined as number | undefined,
    payStatus: undefined as number | undefined,
    createTimeRange: [] as string[]
  }
})

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 详情对话框控制
const detailDialogVisible = ref(false)
const selectedOrderData = ref<OrderInfoEntity | null>(null)

// 获取订单列表
const fetchList = async () => {
  try {
    loading.value = true
    // 构建请求参数
    const params: any = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      params: {
        orderNo: searchForm.params.orderNo,
        productName: searchForm.params.productName,
        orderStatus: searchForm.params.orderStatus,
        payStatus: searchForm.params.payStatus,
        startTime: searchForm.params.createTimeRange?.[0],
        endTime: searchForm.params.createTimeRange?.[1]
      }
    }
    const res = await orderApi.getList(params)
    // 根据实际接口结构调整
    if (res.data && res.data.data) {
      tableList.value = res.data.data || []
      pagination.total = res.data.total || 0
    } else {
      tableList.value = res.data || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.pageNum = 1
  fetchList()
}

// 重置
const handleReset = () => {
  searchForm.params.orderNo = ''
  searchForm.params.productName = ''
  searchForm.params.orderStatus = undefined
  searchForm.params.payStatus = undefined
  searchForm.params.createTimeRange = []
  pagination.pageNum = 1
  fetchList()
}

// 查看详情
const handleDetail = (row: OrderInfoEntity) => {
  selectedOrderData.value = row
  detailDialogVisible.value = true
}

// 支付订单
const handlePay = async (row: OrderInfoEntity) => {
  try {
    await ElMessageBox.confirm(`确认支付订单 ${row.orderNo} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    // 调用支付接口
    await orderApi.payOrder({
      orderNo:row.orderNo,
      payType:1
    }) // 假设默认支付类型1
    ElMessage.success('支付成功')
    fetchList() // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('支付失败')
    }
  }
}

// 取消订单
const handleCancel = async (row: OrderInfoEntity) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入取消原因'
    })
    await orderApi.cancelOrder(row.orderNo, reason)
    ElMessage.success('订单已取消')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

// 确认收货
// const handleConfirmReceive = async (row: OrderInfoEntity) => {
//   try {
//     await ElMessageBox.confirm(`确认已收到订单 ${row.orderNo} 的商品吗？`, '提示', {
//       confirmButtonText: '确定',
//       cancelButtonText: '取消',
//       type: 'warning'
//     })
//     // 假设有确认收货接口
//     await deliveryApi.receiveDelivery(row.orderNo)
//     ElMessage.success('确认收货成功')
//     fetchList()
//   } catch (error) {
//     if (error !== 'cancel') {
//       ElMessage.error('操作失败')
//     }
//   }
// }

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  fetchList()
}

// 页码改变
const handlePageChange = (page: number) => {
  pagination.pageNum = page
  fetchList()
}

// 格式化价格
const formatPrice = (price: number) => {
  return price?.toFixed(2) ?? '0.00'
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
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// 订单状态映射
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

// 支付状态映射
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

// 页面加载
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.order-manage {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.search-container {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

.table-container {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}

.product-info {
  padding: 4px 0;
}
.product-name {
  font-weight: 500;
  margin-bottom: 4px;
}
.product-sku {
  font-size: 12px;
  color: #666;
}
.product-quantity {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.amount-info {
  line-height: 1.6;
}
.pay-amount {
  font-weight: 500;
  color: #ff6b35;
}
</style>
