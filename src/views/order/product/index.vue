<template>
  <div class="product-manage">
    <div class="page-header">
      <h2>商品管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd"
                   v-if="userStore.hasPermission('order:product:add')">
          <el-icon>
            <Plus/>
          </el-icon>
          新增商品
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
        <el-form-item label="商品名称">
          <el-input
            v-model="searchForm.params.productName"
            placeholder="请输入商品名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="商品状态">
          <el-select v-model="searchForm.params.status" placeholder="请选择状态" clearable
                     style="width: 120px">
            <el-option label="上架" :value="1"/>
            <el-option label="下架" :value="0"/>
          </el-select>
        </el-form-item>
        <el-form-item label="价格范围">
          <el-input-number
            v-model="searchForm.params.minPrice"
            placeholder="最低价"
            :min="0"
            :controls="false"
            style="width: 110px"
          />
          <span style="margin: 0 8px">至</span>
          <el-input-number
            v-model="searchForm.params.maxPrice"
            placeholder="最高价"
            :min="0"
            :controls="false"
            style="width: 110px"
          />
        </el-form-item>
        <el-form-item label="库存范围">
          <el-input-number
            v-model="searchForm.params.minStock"
            placeholder="最小库存"
            :min="0"
            :controls="false"
            style="width: 110px"
          />
          <span style="margin: 0 8px">至</span>
          <el-input-number
            v-model="searchForm.params.maxStock"
            placeholder="最大库存"
            :min="0"
            :controls="false"
            style="width: 110px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <!--          <el-button @click="exportProducts" type="success" v-if="userStore.hasPermission('product:export')">-->
          <!--            导出-->
          <!--          </el-button>-->
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
        <el-table-column prop="productName" label="商品名称" min-width="180">
          <template #default="{ row }">
            <div class="product-name-cell">
              <el-image
                v-if="row.imageUrl"
                :src="row.imageUrl"
                :preview-src-list="[row.imageUrl]"
                preview-teleported
                style="width: 40px; height: 40px; margin-right: 10px; border-radius: 4px;"
                fit="cover"
              />
              <div class="product-info">
                <div class="product-name">{{ row.productName }}</div>
                <div class="product-desc" v-if="row.productDesc">{{ row.productDesc }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="120">
          <template #default="{ row }">
            <span class="price-tag">¥{{ formatPrice(row.price) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100">
          <template #default="{ row }">
            <el-tag :type="row.stock > 50 ? 'success' : row.stock > 10 ? 'warning' : 'danger'">
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="秒杀信息" width="160">
          <template #default="{ row }">
            <div v-if="row.seckillPrice && row.seckillStock > 0" class="seckill-info">
              <div class="seckill-price">
                <span class="original-price">¥{{ formatPrice(row.price) }}</span>
                <span class="seckill-price-current">¥{{ formatPrice(row.seckillPrice) }}</span>
              </div>
              <div class="seckill-stock">秒杀库存: {{ row.seckillStock }}</div>
              <div class="seckill-time">
                {{ formatTime(row.seckillStartTime) }} ~ {{ formatTime(row.seckillEndTime) }}
              </div>
            </div>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
              v-if="userStore.hasPermission('product:edit')"
            />
            <el-tag v-else :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
              v-if="userStore.hasPermission('order:product:edit')"
            >
              编辑
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="handleDetail(row)"
              v-if="userStore.hasPermission('order:product:query')"
            >
              商品详情
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="handleCouponDetail(row)"
              v-if="userStore.hasPermission('order:coupon:query')"
            >
              查看优惠券
            </el-button>
            <br>
            <br>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="userStore.hasPermission('order:product:delete')"
            >
              删除
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="handleSetSeckill(row)"
              v-if="userStore.hasPermission('order:product:seckill')"
            >
              设置秒杀
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="handleSetCoupon(row)"
              v-if="userStore.hasPermission('order:product:seckill')"
            >
              配置优惠券
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
        <ProductDialog
          v-model:visible="dialogVisible"
          :is-edit="isEditMode"
          :edit-data="currentEditData"
          @success="handleDialogSuccess"
        />

        <!-- 详情对话框 -->
        <ProductDetail
          v-model:visible="detailDialogVisible"
          :product-data="selectedProductData"
        />
    <!-- 优惠券查看对话框 -->
        <CouponDialog
          v-model:visible="couponDialogVisible"
          :product-id="selectedProductForCoupon?.id"
          :product-name="selectedProductForCoupon?.productName"
        />
        <!-- 秒杀设置对话框 -->
        <SeckillDialog
          v-model:visible="seckillDialogVisible"
          :product-data="selectedSeckillData"
          @success="handleSeckillSuccess"
        />
        <CouponConfigDialog
          v-model:visible="configDialogVisible"
          :product-id="selectedProductForConfig?.id"
          :product-name="selectedProductForConfig?.productName"
          @success="handleConfigSuccess"
        />
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Plus} from '@element-plus/icons-vue'
import {useUserStore} from '@/stores/user.ts'
import type {ProductItem} from '@/types'
import {productApi} from '@/api'
import ProductDetail from "@/views/order/product/components/ProductDetail.vue"
import ProductDialog from "@/views/order/product/components/ProductDialog.vue"
import SeckillDialog from "@/views/order/product/components/SeckillDialog.vue"
import CouponDialog  from "@/views/order/product/components/CouponDialog.vue"
import CouponConfigDialog from '@/views/order/product/components/CouponConfigDialog.vue'

const userStore = useUserStore()

// 加载状态
const loading = ref(false)

// 商品列表
const tableList = ref<ProductItem[]>([])

// 搜索表单
const searchForm = reactive({
  params: {
    productName: '',
    status: undefined as number | undefined,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    minStock: undefined as number | undefined,
    maxStock: undefined as number | undefined
  }
})

// 对话框控制
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditData = ref<any>(null)

// 详情对话框控制
const detailDialogVisible = ref(false)
const selectedProductData = ref<ProductItem | null>(null)

// 秒杀对话框控制
const seckillDialogVisible = ref(false)
const selectedSeckillData = ref<ProductItem | null>(null)

//商品对应优惠券控制对话框
const couponDialogVisible = ref(false)
const selectedProductForCoupon = ref<{ id: string; productName: string } | null>(null)

//优惠券的配置页面
const configDialogVisible = ref(false)
const selectedProductForConfig = ref<{ id: string; productName: string } | null>(null)

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 获取商品列表
const fetchList = async () => {
  try {
    loading.value = true

    // 构建请求参数
    const params: any = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    // 添加搜索条件
    const res = await productApi.getPage(params)

    // 根据接口数据结构调整
    if (res.data && res.data.data) {
      tableList.value = res.data.data || []
      pagination.total = res.data.total || 0
    } else {
      tableList.value = res.data.data || []
      pagination.total = res.data.total || 0
    }

  } catch (error) {
    ElMessage.error('获取商品列表失败')
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
  searchForm.params.productName = ''
  searchForm.params.status = undefined
  searchForm.params.minPrice = undefined
  searchForm.params.maxPrice = undefined
  searchForm.params.minStock = undefined
  searchForm.params.maxStock = undefined
  pagination.pageNum = 1
  fetchList()
}

// 新增
const handleAdd = () => {
  isEditMode.value = false
  currentEditData.value = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: ProductItem) => {
  isEditMode.value = true
  currentEditData.value = {...row}
  dialogVisible.value = true
}

// 详情
const handleDetail = (row: ProductItem) => {
  selectedProductData.value = row
  detailDialogVisible.value = true
}

const handleCouponDetail = (row: ProductItem) => {
  selectedProductForCoupon.value = {
    id: row.id,
    productName: row.productName
  }
  couponDialogVisible.value = true
}

// 设置秒杀
const handleSetSeckill = (row: ProductItem) => {
  selectedSeckillData.value = row
  seckillDialogVisible.value = true
}

// 删除
const handleDelete = async (row: ProductItem) => {
  try {
    await ElMessageBox.confirm(
      `确定删除商品 "${row.productName}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // await productApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchList()

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 状态变更
const handleStatusChange = async (row: ProductItem) => {
  console.log("状态变更,商品id :{}", row.id)
  // try {
  //   await productApi.updateStatus(row.id, row.status)
  //   ElMessage.success(row.status === 1 ? '商品已上架' : '商品已下架')
  // } catch (error) {
  //   // 恢复原状态
  //   row.status = row.status === 1 ? 0 : 1
  //   ElMessage.error('状态更新失败')
  // }
}

// 对话框操作成功
const handleDialogSuccess = () => {
  fetchList()
  ElMessage.success('操作成功')
}
//
// 秒杀设置成功
const handleSeckillSuccess = () => {
  fetchList()
  ElMessage.success('秒杀设置成功')
}


const handleSetCoupon = (row: ProductItem) => {
  selectedProductForConfig.value = { id: row.id, productName: row.productName }
  configDialogVisible.value = true
}


const handleConfigSuccess = () => {
  ElMessage.success('优惠券配置成功')
  // 可选：刷新商品列表（如果需要显示关联信息）
}
// // 导出商品
// const exportProducts = async () => {
//   try {
//     loading.value = true
//     const params = { ...searchForm }
//     await productApi.export(params)
//     ElMessage.success('导出成功')
//   } catch (error) {
//     ElMessage.error('导出失败')
//   } finally {
//     loading.value = false
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
  return price.toFixed(2)
}

// 格式化日期
const formatDate = (dateString: string) => {
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
  } catch (error) {
    return dateString
  }
}

// 格式化时间（仅显示时分）
const formatTime = (dateString: string) => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// 页面加载
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.product-manage {
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

.product-name-cell {
  display: flex;
  align-items: center;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.product-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.price-tag {
  color: #ff6b35;
  font-weight: 500;
}

.seckill-info {
  font-size: 12px;
}

.seckill-price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.original-price {
  text-decoration: line-through;
  color: #999;
}

.seckill-price-current {
  color: #ff6b35;
  font-weight: 500;
}

.seckill-stock {
  color: #666;
  margin-bottom: 2px;
}

.seckill-time {
  color: #409eff;
}
</style>
