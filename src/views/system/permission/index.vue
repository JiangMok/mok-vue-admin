<template>
  <div class="permission-manage">
    <div class="page-header">
      <h2>权限管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd"
                   v-if="userStore.hasPermission('system:permission:add')">
          <el-icon>
            <Plus/>
          </el-icon>
          新增权限
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入权限名称/编码"
            clearable
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.params.type" placeholder="请选择类型" clearable style="width: 200px">
            <el-option label="菜单" :value="1" />
            <!-- <el-option label="按钮" :value="2" /> -->
            <el-option label="接口" :value="3" />
          </el-select>
        </el-form-item>
<!--        <el-form-item label="状态">-->
<!--          <el-select v-model="searchForm.params.status" placeholder="请选择状态" clearable>-->
<!--            <el-option label="启用" :value="1" />-->
<!--            <el-option label="禁用" :value="0" />-->
<!--          </el-select>-->
<!--        </el-form-item>-->
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
        :indent="30"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="permissionName" label="权限名称" :min-width="nameColMinWidth">
          <template #default="{ row }">
            <div class="permission-name-cell">
              <el-icon v-if="row.icon" class="type-icon">
                <component :is="getIconComponent(row.icon)" />
              </el-icon>
              <el-icon v-else-if="row.type === 3" class="type-icon type-icon--api">
                <Link />
              </el-icon>
              {{ row.permissionName }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="permissionCode" label="权限编码" width="180"/>
        <el-table-column prop="description" label="描述" min-width="150"/>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="150">
          <template #default="{ row }">
            {{ row.path || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="component" label="组件路径" width="150">
          <template #default="{ row }">
            {{ row.component || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <div v-if="row.icon" class="icon-cell">
              <el-icon>
                <component :is="getIconComponent(row.icon)" />
              </el-icon>
              <span class="icon-name">{{ row.icon }}</span>
            </div>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80"/>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="visible" label="显示" width="80">
          <template #default="{ row }">
            <el-tag :type="row.visible === 1 ? 'success' : 'info'">
              {{ row.visible === 1 ? '显示' : '隐藏' }}
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
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
              v-if="userStore.hasPermission('system:permission:edit')"
            >
              编辑
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleDetail(row)"
              v-if="userStore.hasPermission('system:permission:query')"
            >
              详情
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="userStore.hasPermission('system:permission:delete')"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <PermissionDialog
      v-model:visible="dialogVisible"
      :is-edit="isEditMode"
      :edit-data="currentEditData"
      @success="handleDialogSuccess"
    />

    <!-- 详情对话框 -->
    <PermissionDetail
      v-model:visible="detailDialogVisible"
      :table-data="selectedTableData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Link } from '@element-plus/icons-vue'
import { getIconComponent } from '@/utils/icons'
import { buildPermissionTree } from '@/utils/tree'
import { useUserStore } from '@/stores/user.ts'
import type { PermissionItem } from '@/types'
import { permissionApi } from '@/api'
import PermissionDetail from "@/views/system/permission/components/PermissionDetail.vue";
import PermissionDialog from "@/views/system/permission/components/PermissionDialog.vue";

// 使用userStore验证权限
const userStore = useUserStore()

// 加载状态
const loading = ref(false)

// 权限列表
const tableList = ref<PermissionItem[]>([])

// 递归计算树的最大深度
const getMaxDepth = (nodes: any[], depth: number = 0): number => {
  let maxDepth = depth
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      maxDepth = Math.max(maxDepth, getMaxDepth(node.children, depth + 1))
    }
  }
  return maxDepth
}

// 权限名称列最小宽度：基础 200px + 每层 32px（含 indent 30px + 箭头空间）
const nameColMinWidth = computed(() => 200 + getMaxDepth(tableList.value) * 32)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  params: {
    type: undefined,
    status: undefined
  }
})

// 对话框控制
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditData = ref<any>(null)

// 详情对话框控制
const detailDialogVisible = ref(false)
const selectedTableData = ref<PermissionItem | null>(null)

// 获取权限列表
const fetchList = async () => {
  try {
    loading.value = true

    // 构建搜索参数
    const params: Record<string, any> = { ...searchForm }
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined || params[key] === null) {
        delete params[key]
      }
    })

    // 获取所有权限（树形展示不分页）
    const res = await permissionApi.getPage({ pageNum: 1, pageSize: 999, ...params })
    const flatList = res.data?.data || []
    tableList.value = buildPermissionTree(flatList)

  } catch (error) {
    // console.error('获取权限列表失败:', error)
    ElMessage.error('获取权限列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  fetchList()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.params.status = undefined
  searchForm.params.type = undefined
  fetchList()
}

// 新增
const handleAdd = () => {
  isEditMode.value = false
  currentEditData.value = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: PermissionItem) => {
  isEditMode.value = true
  currentEditData.value = { ...row }
  dialogVisible.value = true
}

// 详情
const handleDetail = (row: PermissionItem) => {
  selectedTableData.value = row
  detailDialogVisible.value = true
}

// 删除
const handleDelete = async (row: PermissionItem) => {
  try {
    await ElMessageBox.confirm(
      `确定删除权限 "${row.permissionName}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await permissionApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchList()

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 对话框操作成功
const handleDialogSuccess = () => {
  fetchList()
  ElMessage.success('操作成功')
}

// 获取类型文本（1=菜单 2=按钮 3=接口）
const getTypeText = (type: number) => {
  const typeMap: Record<number, string> = {
    1: '菜单',
    2: '按钮',
    3: '接口'
  }
  return typeMap[type] || '未知'
}

// 获取类型标签样式
const getTypeTagType = (type: number) => {
  const typeMap: Record<number, string> = {
    1: '',
    2: 'success',
    3: 'warning'
  }
  return typeMap[type] || 'info'
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
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    // console.log('日期格式化失败:', error)
    return dateString
  }
}

// 页面加载
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.permission-manage {
  padding: 20px;
  background: white;
  border-radius: 8px;
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

/* 搜索区域：采用 Flex 布局实现均匀间距，避免底部多余空白 */
.search-container {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

/* 将 el-form 改为 flex 容器，由 gap 控制表单项间距 */
.search-container .el-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;  /* 行间距12px，列间距18px */
  margin: 0;
}

/* 重置表单项的外边距，完全由 gap 控制 */
.search-container .el-form-item {
  margin: 0 !important;
  width: auto; /* 保持自动宽度 */
}

/* 类型选择器宽度固定（保持原有内联样式 width:200px 已生效，此处可省略或保留备用） */
.search-container .el-select {
  width: 200px;
}

/* 按钮组内部：搜索和重置按钮之间增加间距 */
.search-container .el-form-item .el-button + .el-button {
  margin-left: 12px;
}

/* 清除按钮默认的左外边距，使其与左侧表单项对齐 */
.search-container .el-form-item .el-button:first-child {
  margin-left: 0;
}

.table-container {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}

.permission-name-cell {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.type-icon {
  margin-right: 8px;
  color: #409eff;
}

.type-icon--api {
  color: #909399;
}

.icon-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-name {
  font-size: 12px;
  color: #666;
}
</style>
