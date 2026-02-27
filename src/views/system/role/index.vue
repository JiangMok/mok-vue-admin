<template>
  <div class="user-manage">
    <div class="page-header">
      <h2>角色管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd"
                   v-if="userStore.hasPermission('system:user:add')">
          <el-icon>
            <Plus/>
          </el-icon>
          新增角色
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入角色名称/角色编码"
            clearable
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
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <!--        <el-table-column type="selection" width="55"/>-->
        <el-table-column prop="roleName" label="角色名称" width="160"/>
        <el-table-column prop="roleCode" label="角色编码" width="160"/>
        <el-table-column prop="description" label="角色描述" width=""/>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="更新时间">
          <template #default="{ row }">
            {{ formatDate(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
              v-if="userStore.hasPermission('system:role:edit') && row.roleCode !== 'ROLE_ADMIN' "
            >
              编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              @click="handleDetail(row)"
              v-if="userStore.hasPermission('system:role:query')"
            >
              详情
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="userStore.hasPermission('system:role:delete') && row.roleCode !== 'ROLE_ADMIN'"
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
    <RoleDialog
      v-model:visible="dialogVisible"
      :is-edit="isEditMode"
      :edit-data="currentEditData"
      @success="handleDialogSuccess"
    />
    <!--******* 数据传递 ---(共8步,1-2在父组件,3-8在子组件)-->
    <!-- |-1.父组件引用子组件 -- 开始传递数据 -->
    <!-- |--:visible="detailDialogVisible" 控制对话框显示 >>> 双向绑定,等价于:
         |--                                                         :visible="detailDialogVisible"
         |--                                                         @update:visible="detailDialogVisible = $event"-->
    <!-- |--:tableId="selectedTableId" 对应行的id >>> 单向数据流,使用props传递-->
    <!-- |--:table-data="tableData" 完整的角色对象 >>> 单向数据流,使用props传递-->
    <RoleDetail
      v-model:visible="detailDialogVisible"
      :tableId="selectedTableId"
      :table-data="tableData"
    />
  </div>

</template>

<script setup lang="ts">
import type {OperationLog, RoleItem} from "@/types";
import {onMounted, reactive, ref} from "vue";
import {useUserStore} from "@/stores/user.ts";
import {ElMessage, ElMessageBox} from "element-plus";
import {roleApi} from "@/api";
import {Plus} from "@element-plus/icons-vue";
import RoleDialog from "@/views/system/role/components/RoleDialog.vue";
import RoleDetail from "@/views/system/role/components/RoleDetail.vue";

//===========创建基础对象 表单默认值===============
//使用userStore验证权限
const userStore = useUserStore()
// 加载状态
const loading = ref(false)
//操作日志列表
const tableList = ref<RoleItem[]>([])
//搜索表单
const searchForm = reactive({
  keyword: '',
  params: {
    operatorType: undefined,
    status: undefined
  }
})
// 表格选择
const selectedRows = ref<OperationLog[]>([])
//====== 增加、修改、详情 弹窗控制 --- 开始 ======
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditData = ref<any>(null)
//向子组件传的ID
const selectedTableId = ref('')
//详情页面的显示:默认不显示
const detailDialogVisible = ref(false)
//初始化表格,注意等号后面的数据类型绑定
const tableData = ref<RoleItem | null>(null)
//====== 增加、修改、详情 弹窗控制 --- 结束 ======
//===========================函数---开始==============================

/**
 * 详情
 */
//******* 数据传递 ---(共8步,1-2在父组件,3-8在子组件)
// |-2.实现详情按钮的点击事件方法(这里只是给template中的组件赋值,子组件调用数据的话还是调用template中冒号(:)后边的属性)
// |--tableData.value 确定tableData的数据是哪一行的数据()详情按钮的:@click="handleDetail(row)"这一行的数据
// |--selectedTableId.value 确定是哪一行的id
// |--detailDialogVisible.value 设置子组件为显示状态
const handleDetail = (row: RoleItem) => {
  selectedTableId.value = row.id
  tableData.value = row
  detailDialogVisible.value = true
}
/**
 * 表格选择改变
 */
const handleSelectionChange = (rows: OperationLog[]) => {
  selectedRows.value = rows
}
/**
 * 获取列表
 */
const fetchList = async () => {
  try {
    loading.value = true

    // 构建请求参数
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    // 清除空值
    const cleanParams: Record<string, any> = { ...params }
    Object.keys(cleanParams).forEach(key => {
      if (cleanParams[key] === '' || cleanParams[key] === undefined || cleanParams[key] === null) {
        delete cleanParams[key]
      }
    })
    const res = await roleApi.getPage(params)
    // console.log('列表响应:', res)
    //将返回的数据传给页面列表
    tableList.value = res.data.data || []
    pagination.total = res.data.total || 0
  } catch (error) {
    // console.error('获取列表失败:', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}
/**
 * 删除
 */
const handleDelete = async (row: OperationLog) => {
  try {
    await ElMessageBox.confirm(
      `确定删除吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await roleApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error("操作失败")
    }
  }
}

/**
 * 编辑
 */
const handleEdit = (row: RoleItem) => {
  // ================== 修改：打开编辑用户对话框 ==================
  isEditMode.value = true
  currentEditData.value = {...row}
  dialogVisible.value = true
}
/**
 * 新增
 */
const handleAdd = (row: RoleItem) => {
  // ================== 修改：打开添加用户对话框 ==================
  isEditMode.value = false
  currentEditData.value = {...row}
  dialogVisible.value = true
}
// ================== 处理 新增、修改 对话框操作成功 ==================
const handleDialogSuccess = () => {
  // 刷新列表
  fetchList()
  ElMessage.success('操作成功')
}
//===========================函数---结束==============================
//===========================分页---开始==============================
//分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})
/**
 * 分页大小改变
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  fetchList()
}

/**
 * 页码改变
 */
const handlePageChange = (page: number) => {
  pagination.pageNum = page
  fetchList()
}
//=================页面加载时的操作(生命周期钩子)============================================
onMounted(() => {
  fetchList()
})
//===========================分页---结束==============================
/**
 * 搜索:保留搜索条件,重置到第1页
 */
const handleSearch = () => {
  pagination.pageNum = 1
  fetchList()
}
/**
 * 重置搜索:清空搜索条件,重置到第1页
 */
const handleReset = () => {
  searchForm.keyword = ''
  pagination.pageNum = 1
  fetchList()
}
/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
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
    // console.log("日期格式化失败:", error)
    return dateString
  }
}
</script>

<style scoped>
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
