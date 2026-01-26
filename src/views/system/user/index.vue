<template>
  <div class="user-manage">
    <div class="page-header">
      <h2>用户管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd"
                   v-if="userStore.hasPermission('system:user:add')">
          <el-icon>
            <Plus/>
          </el-icon>
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
<!--        <el-table-column type="selection" width="55"/>-->

        <el-table-column prop="username" label="用户名" width="160"/>
        <el-table-column prop="nickname" label="昵称" width="200"/>
        <el-table-column prop="phone" label="手机号" width="130"/>
        <el-table-column prop="email" label="邮箱" width="230"/>

        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="340" fixed="right">
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
    <!-- ================== 新增：用户详情对话框 ================== -->
    <!-- :user-data="selectedUserData" 完整写法是 v-bind:user-data -->
    <!--    它表示将 selectedUserData 这个变量动态绑定到子组件的 userData 属性上-->
    <!--    这是一个单向数据流：父组件的 selectedUserData 变化时，会自动传递给子组件-->
    <!--============-->
    <!-- @edit 是 Vue 中监听子组件自定义事件的语法，它是 v-on:edit 的简写形式。-->
    <!--    @edit="handleEditFromDetail"-->
    <!--    表示监听 UserDetail 组件内部触发的名为 edit 的事件。-->
    <UserDetail
      v-model:visible="detailDialogVisible"
      :userId="selectedUserId"
      :user-data="selectedUserData"
      @edit="handleEditFromDetail"
    />
  </div>

</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Plus} from '@element-plus/icons-vue'
import {userApi} from '@/api'
import {useUserStore} from '@/stores/user'
import type {UserInfo} from '@/types'
import UserDialog from './components/UserDialog.vue'
import UserDetail from './components/UserDetail.vue'
import {formatDateTime} from "@/utils/formatter.ts";
//================基础对象创建   &   表单基础赋值===============================================
const userStore = useUserStore()
// 加载状态
const loading = ref(false)
// 用户列表数据
const userList = ref<UserInfo[]>([])
// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: undefined
})
// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})
// 表格选择
const selectedRows = ref<UserInfo[]>([])
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditData = ref<any>(null)

const detailDialogVisible = ref(false)
const selectedUserId = ref('')
const selectedUserData = ref<UserInfo | null>(null)

// 搜索表单 - 修改为更明确的类型定义
interface SearchForm {
  keyword: string;
  status?: number | undefined;  // 使用 undefined 而不是空字符串
}

//=================页面需要的函数=================================
/**
 * 获取用户列表
 */
const fetchUserList = async () => {
  try {
    loading.value = true

    // 构建请求参数
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    ///相当于
    // const params = {
    //   pageNum: 2,        // 来自 pagination.pageNum
    //   pageSize: 10,      // 来自 pagination.pageSize
    //   username: '张三',  // 来自 searchForm.username
    //   status: 1         // 来自 searchForm.status
    // }

    // 清除空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key]
      }
    })
    console.log('请求用户列表参数:', params)
    const res = await userApi.getUsers(params)
    console.log('用户列表响应:', res)
    // 注意：你的接口返回是嵌套的data
    userList.value = res.data.data || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 搜索:保留搜索条件,重置到第1页
 */
const handleSearch = () => {
  pagination.pageNum = 1
  fetchUserList()
}

/**
 * 重置搜索:清空搜索条件,重置到第1页
 */
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = undefined
  pagination.pageNum = 1
  fetchUserList()
}

/**
 * 分页大小改变
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  fetchUserList()
}

/**
 * 页码改变
 */
const handlePageChange = (page: number) => {
  pagination.pageNum = page
  fetchUserList()
}

/**
 * 表格选择改变
 */
const handleSelectionChange = (rows: UserInfo[]) => {
  selectedRows.value = rows
}

/**
 * 新增用户
 */
const handleAdd = () => {
  // ================== 修改：打开添加用户对话框 ==================
  isEditMode.value = false
  currentEditData.value = null
  dialogVisible.value = true
}
/**
 * 重置密码
 */
const resetPwd = async (row: UserInfo) => {
  // ElMessage.info("重置密码:" + row.id)
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
      ElMessage.error(e.msg)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`用户 "${row.nickname}" 的密码重置失败`)
    }
  }
}

/**
 * 编辑用户
 */
const handleEdit = (row: UserInfo) => {
  // ================== 修改：打开编辑用户对话框 ==================
  isEditMode.value = true
  currentEditData.value = {...row}
  dialogVisible.value = true
}
/**
 * 用户详情
 */
const handleDetail = (row: UserInfo) => {
  selectedUserId.value = row.id
  selectedUserData.value = row
  detailDialogVisible.value = true
}

// ================== 新增：从详情页跳转到编辑 ==================
const handleEditFromDetail = (userId: string) => {
  // 关闭详情对话框
  detailDialogVisible.value = false

  // 找到对应的用户数据
  const user = userList.value.find(item => item.id === userId)
  if (user) {
    // 打开编辑对话框
    handleEdit(user)
  }
}
/**
 * 删除用户
 */
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

// ================== 新增：处理对话框操作成功 ==================
const handleDialogSuccess = () => {
  // 刷新用户列表
  fetchUserList()
  // ElMessage.success('操作成功')
}

//=================页面加载时的操作(生命周期钩子)============================================
onMounted(() => {
  console.log('用户管理页面加载')
  fetchUserList()
})
</script>

<style scoped>
.user-manage {
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
