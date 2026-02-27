<template>
  <div class="delivery-manage">
    <div class="page-header">
      <h2>发货管理</h2>
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
        <el-form-item label="收货人">
          <el-input
            v-model="searchForm.params.receiverName"
            placeholder="请输入收货人"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input
            v-model="searchForm.params.deliveryNumber"
            placeholder="请输入物流单号"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="发货状态">
          <el-select v-model="searchForm.params.deliveryStatus" placeholder="请选择" clearable style="width: 120px">
            <el-option label="待发货" :value="0" />
            <el-option label="已发货" :value="1" />
            <el-option label="已收货" :value="2" />
          </el-select>
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
        <el-table-column prop="deliveryNo" label="发货单号" width="180" />
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            <div class="product-info">
              <div class="product-name">{{ row.productName }}</div>
              <div class="product-quantity">x{{ row.quantity }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="收货信息" min-width="200">
          <template #default="{ row }">
            <div>{{ row.receiverName }}</div>
            <div>{{ row.receiverPhone }}</div>
            <div class="address">{{ row.receiverAddress }}</div>
          </template>
        </el-table-column>
        <el-table-column label="物流信息" min-width="200">
          <template #default="{ row }">
            <div v-if="row.deliveryCompany">
              <span>{{ row.deliveryCompany }}</span>
              <span class="delivery-number">{{ row.deliveryNumber }}</span>
            </div>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="发货状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.deliveryStatus)">
              {{ getStatusText(row.deliveryStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发货时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.deliveryTime) }}
          </template>
        </el-table-column>
        <el-table-column label="收货时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.receiveTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleDetail(row)"
              v-if="userStore.hasPermission('order:delivery:query')"
            >
              详情
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handleShip(row)"
              v-if="row.deliveryStatus === 0 && userStore.hasPermission('order:delivery:ship')"
            >
              发货
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="handleReceive(row)"
              v-if="row.deliveryStatus === 1 && userStore.hasPermission('order:delivery:receive')"
            >
              确认收货
            </el-button>
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

    <!-- 发货对话框 -->
    <el-dialog
      v-model="shipDialogVisible"
      title="发货"
      width="500px"
      :before-close="handleShipClose"
    >
      <el-form
        ref="shipFormRef"
        :model="shipForm"
        :rules="shipRules"
        label-width="100px"
      >
        <el-form-item label="发货单号">
          <el-input v-model="currentDelivery.deliveryNo" disabled />
        </el-form-item>
        <el-form-item label="物流公司" prop="deliveryCompany">
          <el-input v-model="shipForm.deliveryCompany" placeholder="请输入物流公司" />
        </el-form-item>
        <el-form-item label="物流单号" prop="deliveryNumber">
          <el-input v-model="shipForm.deliveryNumber" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shipDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitShip" :loading="shipLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <DeliveryDetail
      v-model:visible="detailDialogVisible"
      :delivery-data="selectedDeliveryData"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { deliveryApi } from '@/api'
import type { DeliveryOrderEntity } from '@/types'
import DeliveryDetail from '@/views/order/delivery/components/DeliveryDetail.vue'

const userStore = useUserStore()

// 加载状态
const loading = ref(false)

// 发货列表
const tableList = ref<DeliveryOrderEntity[]>([])

// 搜索表单
const searchForm = reactive({
  params: {
    orderNo: '',
    receiverName: '',
    deliveryNumber: '',
    deliveryStatus: undefined as number | undefined
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
const selectedDeliveryData = ref<DeliveryOrderEntity | null>(null)

// 发货对话框控制
const shipDialogVisible = ref(false)
const currentDelivery = ref<DeliveryOrderEntity | null>(null)
const shipFormRef = ref<FormInstance>()
const shipForm = reactive({
  deliveryCompany: '',
  deliveryNumber: ''
})
const shipLoading = ref(false)

// 发货表单规则
const shipRules: FormRules = {
  deliveryCompany: [
    { required: true, message: '请输入物流公司', trigger: 'blur' },
    { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
  ],
  deliveryNumber: [
    { required: true, message: '请输入物流单号', trigger: 'blur' },
    { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
  ]
}

// 获取发货列表（管理员接口）
const fetchList = async () => {
  try {
    loading.value = true
    const params: any = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      params: {
        orderNo: searchForm.params.orderNo,
        receiverName: searchForm.params.receiverName,
        deliveryNumber: searchForm.params.deliveryNumber,
        deliveryStatus: searchForm.params.deliveryStatus
      }
    }
    const res = await deliveryApi.getPage(params)
    if (res.data?.data) {
      tableList.value = res.data.data || []
      pagination.total = res.data.total || 0
    } else {
      tableList.value = res.data.data || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('获取发货列表失败')
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
  searchForm.params.receiverName = ''
  searchForm.params.deliveryNumber = ''
  searchForm.params.deliveryStatus = undefined
  pagination.pageNum = 1
  fetchList()
}

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

// 查看详情
const handleDetail = (row: DeliveryOrderEntity) => {
  selectedDeliveryData.value = row
  detailDialogVisible.value = true
}

// 打开发货对话框
const handleShip = (row: DeliveryOrderEntity) => {
  currentDelivery.value = row
  shipForm.deliveryCompany = ''
  shipForm.deliveryNumber = ''
  shipDialogVisible.value = true
}

// 关闭发货对话框
const handleShipClose = () => {
  shipDialogVisible.value = false
}

// 提交发货
const submitShip = async () => {
  if (!shipFormRef.value) return
  try {
    await shipFormRef.value.validate()
    if (!currentDelivery.value) return
    shipLoading.value = true
    const deliveryId= currentDelivery.value.id
    const deliveryCompany= shipForm.deliveryCompany
    const deliveryNumber=shipForm.deliveryNumber
    const res = await deliveryApi.shipDelivery(deliveryId, deliveryCompany, deliveryNumber)
    if (res?.code === 200) {
      ElMessage.success('发货成功')
      shipDialogVisible.value = false
      fetchList() // 刷新列表
    } else {
      ElMessage.error(res.data?.msg || '发货失败')
    }
  } catch (error) {
    ElMessage.error('发货失败')
  } finally {
    shipLoading.value = false
  }
}

// 确认收货
const handleReceive = async (row: DeliveryOrderEntity) => {
  try {
    await ElMessageBox.confirm(`确认订单 ${row.orderNo} 已收货吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await deliveryApi.receiveDelivery(row.id)
    if (res?.code === 200) {
      ElMessage.success('确认收货成功')
      fetchList()
    } else {
      ElMessage.error(res.data?.msg || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 状态映射
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

// 格式化日期时间
const formatDateTime = (date: string | Date | null) => {
  if (!date) return ''
  try {
    const d = new Date(date)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return String(date)
  }
}

// 页面加载
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.delivery-manage {
  padding: 20px;
}

.page-header {
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
.product-quantity {
  font-size: 12px;
  color: #999;
}
.address {
  font-size: 12px;
  color: #666;
}
.delivery-number {
  margin-left: 8px;
  font-family: monospace;
}
</style>
