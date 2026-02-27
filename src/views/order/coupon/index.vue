<template>
  <div class="coupon-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>优惠券管理</h2>
      <div class="header-actions">
        <el-button
          type="primary"
          @click="handleAdd"
          v-if="userStore.hasPermission('order:coupon:add')"
        >
          <el-icon><Plus /></el-icon>
          新增优惠券
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
        <el-form-item label="优惠券名称">
          <el-input
            v-model="searchForm.couponName"
            placeholder="优惠券名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="优惠券类型">
          <el-select
            v-model="searchForm.couponType"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="满减券" :value="1" />
            <el-option label="折扣券" :value="2" />
            <el-option label="立减券" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部"
            clearable
            style="width: 100px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
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
        <el-table-column prop="couponName" label="优惠券名称" min-width="160" />
        <el-table-column prop="couponType" label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.couponType)">
              {{ getTypeText(row.couponType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" min-width="140">
          <template #default="{ row }">
            <span v-if="row.couponType === 1">
              ￥{{ row.discountAmount }} (满￥{{ row.thresholdAmount }})
            </span>
            <span v-else-if="row.couponType === 2">
              {{ row.discountRate }}折
            </span>
            <span v-else-if="row.couponType === 3">
              ￥{{ row.discountAmount }} (无门槛)
            </span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="thresholdAmount" label="使用门槛" width="100">
          <template #default="{ row }">
            {{ row.thresholdAmount ? `满￥${row.thresholdAmount}` : '无门槛' }}
          </template>
        </el-table-column>
        <el-table-column label="总量/剩余" width="120">
          <template #default="{ row }">
            {{ row.totalQuantity }} / {{ row.remainingQuantity }}
          </template>
        </el-table-column>
        <el-table-column prop="perLimit" label="每人限领" width="90" />
        <el-table-column label="有效期" min-width="240">
          <template #default="{ row }">
            {{ formatDate(row.startTime) }} ~ {{ formatDate(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleDetail(row)"
              v-if="userStore.hasPermission('order:coupon:query')"
            >
              详情
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
              v-if="userStore.hasPermission('order:coupon:edit')"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="userStore.hasPermission('order:coupon:delete')"
            >
              删除
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

    <!-- 新增/编辑对话框 -->
    <CouponDialog
      v-model:visible="dialogVisible"
      :is-edit="isEditMode"
      :edit-data="currentEditData"
      @success="handleDialogSuccess"
    />

    <!-- 详情对话框 -->
    <CouponDetail
      v-model:visible="detailDialogVisible"
      :table-data="selectedTableData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { CouponItem } from '@/types/index.ts'
import { couponApi } from '@/api'
import CouponDialog from "@/views/order/coupon/components/CouponDialog.vue"
import CouponDetail from '@/views/order/coupon/components/CouponDetail.vue'

const userStore = useUserStore()
const loading = ref(false)
const tableList = ref<CouponItem[]>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  couponType: undefined as number | undefined,
  status: undefined as number | undefined,
  couponName : undefined as number | undefined
})

// 对话框控制
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditData = ref<CouponItem | null>(null)
const detailDialogVisible = ref(false)
const selectedTableData = ref<CouponItem | null>(null)

// 分页
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 获取列表数据
const fetchList = async () => {
  try {
    loading.value = true
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      params:{
        ...searchForm
      }
    }
    // 清理空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined || params[key] === null) {
        delete params[key]
      }
    })
    const res = await couponApi.getPage(params)
    // 根据实际接口嵌套结构解析
    tableList.value = res.data?.data || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    // console.error('获取优惠券列表失败:', error)
    ElMessage.error('获取优惠券列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索 / 重置
const handleSearch = () => {
  pagination.pageNum = 1
  fetchList()
}
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.couponType = undefined
  searchForm.status = undefined
  searchForm.couponName = undefined
  pagination.pageNum = 1
  fetchList()
}

// 新增 / 编辑 / 详情
const handleAdd = () => {
  isEditMode.value = false
  currentEditData.value = null
  dialogVisible.value = true
}
const handleEdit = (row: CouponItem) => {
  isEditMode.value = true
  currentEditData.value = { ...row }
  dialogVisible.value = true
}
const handleDetail = (row: CouponItem) => {
  selectedTableData.value = row
  detailDialogVisible.value = true
}

// 删除
const handleDelete = async (row: CouponItem) => {
  try {
    await ElMessageBox.confirm(`确定删除优惠券“${row.couponName}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await couponApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 对话框成功回调
const handleDialogSuccess = () => {
  fetchList()
  // ElMessage.success('操作成功')
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  fetchList()
}
const handlePageChange = (page: number) => {
  pagination.pageNum = page
  fetchList()
}

// 类型映射
const getTypeText = (type: number) => {
  const map: Record<number, string> = { 1: '满减券', 2: '折扣券', 3: '立减券' }
  return map[type] || '未知'
}
const getTypeTagType = (type: number) => {
  const map: Record<number, string> = { 1: 'primary', 2: 'success', 3: 'warning' }
  return map[type] || 'info'
}

// 日期格式化
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.coupon-manage {
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
</style>
