<template>
  <div class="user-manage">
    <div class="page-header">
      <h2>用户管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd"
                   v-if="userStore.hasPermission('system:user:add')">
          <el-icon><Plus/></el-icon>
          新增用户
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>

        <el-form-item label="所属部门">
          <el-tree-select
            v-model="searchForm.deptId"
            :data="searchDeptTree"
            :props="{ label: 'deptName', value: 'id', children: 'children' }"
            placeholder="请选择部门"
            clearable
            check-strictly
            style="width: 180px"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable
                     style="width: 120px">
            <el-option label="全部" :value="''"/>
            <el-option label="启用" :value="1"/>
            <el-option label="禁用" :value="0"/>
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
        :data="userList"
        border
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" width="160"/>
        <el-table-column prop="avatar" label="头像" width="65">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar" class="user-avatar">
              {{ row.nickname?.charAt(0) || row.username?.charAt(0) || 'U' }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" width="150"/>
        <el-table-column prop="phone" label="手机号" width="130"/>
        <el-table-column prop="email" label="邮箱" width="200"/>

        <el-table-column prop="deptName" label="所属部门" width="120">
          <template #default="{ row }">
            {{ row.deptName || '--' }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="plain">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" width="160" label="创建时间">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
              v-if="userStore.hasPermission('system:user:edit')"
            >
              编辑
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleDetail(row)"
              v-if="userStore.hasPermission('system:user:query')"
            >
              详情
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="resetPwd(row)"
              v-if="userStore.hasPermission('system:user:edit')"
            >
              重置密码
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="userStore.hasPermission('system:user:delete')"
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

    <UserDialog
      v-model:visible="dialogVisible"
      :is-edit="isEditMode"
      :edit-data="currentEditData"
      @success="handleDialogSuccess"
    />

    <UserDetail
      v-model:visible="detailDialogVisible"
      :userId="selectedUserId"
      :user-data="selectedUserData || undefined"
      @edit="handleEditFromDetail"
    />
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Plus} from '@element-plus/icons-vue'
import {deptApi, userApi} from '@/api'
import {useUserStore} from '@/stores/user'
import type {DeptItem, UserInfo} from '@/types'
import UserDialog from './components/UserDialog.vue'
import UserDetail from './components/UserDetail.vue'
import {formatDateTime} from "@/utils/formatter.ts";

const userStore = useUserStore()
const loading = ref(false)
const userList = ref<UserInfo[]>([])
const searchForm = reactive({
  keyword: '',
  deptId: '',
  status: undefined
})
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})
const selectedRows = ref<UserInfo[]>([])
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditData = ref<any>(null)
const detailDialogVisible = ref(false)
const selectedUserId = ref('')
const selectedUserData = ref<UserInfo | null>(null)
const searchDeptTree = ref<DeptItem[]>([])

const fetchUserList = async () => {
  try {
    loading.value = true
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status,
      params: {} as Record<string, any>
    }
    if (searchForm.deptId) {
      params.params.deptId = searchForm.deptId
    }
    const cleanParams: Record<string, any> = { ...params }
    Object.keys(cleanParams).forEach(key => {
      if (cleanParams[key] === '' || cleanParams[key] === undefined || cleanParams[key] === null) {
        delete cleanParams[key]
      }
    })
    const res = await userApi.getUsers(params)
    userList.value = res.data.data || []
    pagination.total = res.data.total || 0
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchUserList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.deptId = ''
  searchForm.status = undefined
  pagination.pageNum = 1
  fetchUserList()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  fetchUserList()
}

const handlePageChange = (page: number) => {
  pagination.pageNum = page
  fetchUserList()
}

const handleSelectionChange = (rows: UserInfo[]) => {
  selectedRows.value = rows
}

const handleAdd = () => {
  isEditMode.value = false
  currentEditData.value = null
  dialogVisible.value = true
}

const resetPwd = async (row: UserInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定重置用户 "${row.nickname}" 的密码吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    try{
      const res = await userApi.resetPwd(row.id)
      if(res.code === 200){
        ElMessage.success(`用户 "${row.nickname}" 的密码重置成功`)
      }else{
        ElMessage.error(res.msg)
      }
      fetchUserList()
    }catch(e){
      ElMessage.error(e as string)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`用户 "${row.nickname}" 的密码重置失败`)
    }
  }
}

const handleEdit = (row: UserInfo) => {
  isEditMode.value = true
  currentEditData.value = {...row}
  dialogVisible.value = true
}

const handleDetail = (row: UserInfo) => {
  selectedUserId.value = row.id
  selectedUserData.value = row
  detailDialogVisible.value = true
}

const handleEditFromDetail = (userId: string) => {
  detailDialogVisible.value = false
  const user = userList.value.find(item => item.id === userId)
  if (user) {
    handleEdit(user)
  }
}

const handleDelete = async (row: UserInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定删除用户 "${row.nickname}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await userApi.deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchUserList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleDialogSuccess = () => {
  fetchUserList()
}

const fetchSearchDeptTree = async () => {
  try {
    const res = await deptApi.getScopedTree()
    if (res.code === 200) searchDeptTree.value = res.data || []
  } catch { /* ignore */ }
}

onMounted(() => {
  fetchUserList()
  fetchSearchDeptTree()
})
</script>

<style scoped>
.user-manage {
  padding: 24px;
  background: var(--app-bg);
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text);
}

/* Search */
.search-container {
  margin-bottom: 16px;
  padding: 18px 20px;
  background: var(--app-bg-surface);
  border-radius: var(--radius);
  border: 1px solid var(--app-border);
}

.search-container .el-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
  margin: 0;
}

.search-container .el-form-item {
  margin: 0 !important;
  width: auto;
}

.search-container .el-select {
  width: 120px;
}

.search-container .el-form-item .el-button + .el-button {
  margin-left: 10px;
}

/* Table */
.table-container {
  margin-bottom: 16px;
  background: var(--app-bg-surface);
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--app-border);
}

:deep(.table-container .el-table) {
  --el-table-border-color: var(--app-border);
}

:deep(.table-container .el-table th.el-table__cell) {
  background: var(--app-bg-elevated);
  color: var(--app-text-secondary);
  font-weight: 600;
  font-size: 13px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 0 4px;
}
</style>
