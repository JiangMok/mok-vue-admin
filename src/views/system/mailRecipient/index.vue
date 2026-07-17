<template>
  <div class="mail-recipient-manage">
    <div class="page-header">
      <h2>收件人管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus/></el-icon>
          新增收件人
        </el-button>
      </div>
    </div>

    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索邮箱或名称"
        clearable
        style="width: 280px"
        @keyup.enter="fetchList"
        @clear="fetchList"
      >
        <template #append>
          <el-button @click="fetchList"><el-icon><Search/></el-icon></el-button>
        </template>
      </el-input>
    </div>

    <div class="table-container">
      <el-table :data="recipientList" border stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="email" label="邮箱地址" min-width="200" />
        <el-table-column prop="name" label="收件人名称" width="140" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" size="small" @click="handleTestSend(row)">测试</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="fetchList"
      />
    </div>

    <MailRecipientDialog
      v-model:visible="dialogVisible"
      :is-edit="isEditMode"
      :edit-data="currentEditData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { mailRecipientApi } from '@/api'
import { formatDateTime } from '@/utils/formatter'
import type { MailRecipient } from '@/types'
import MailRecipientDialog from './components/MailRecipientDialog.vue'

const loading = ref(false)
const recipientList = ref<MailRecipient[]>([])
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditData = ref<MailRecipient | null>(null)

const fetchList = async () => {
  try {
    loading.value = true
    const res = await mailRecipientApi.getPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    })
    if (res.code === 200) {
      recipientList.value = res.data?.data || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.msg || '获取收件人列表失败')
    }
  } catch {
    ElMessage.error('获取收件人列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEditMode.value = false
  currentEditData.value = null
  dialogVisible.value = true
}

const handleEdit = (row: MailRecipient) => {
  isEditMode.value = true
  currentEditData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row: MailRecipient) => {
  try {
    await ElMessageBox.confirm(`确定删除收件人 "${row.name}" (${row.email}) 吗？`, '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    const res = await mailRecipientApi.delete(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchList()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleTestSend = async (row: MailRecipient) => {
  try {
    await ElMessageBox.confirm(`确定向 "${row.name}" (${row.email}) 发送测试邮件吗？`, '测试发送', {
      confirmButtonText: '发送', cancelButtonText: '取消', type: 'info'
    })
    const res = await mailRecipientApi.testSend(row.id)
    if (res.code === 200) ElMessage.success('测试邮件已发送')
    else ElMessage.error(res.msg || '发送失败')
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('发送失败')
  }
}

const handleDialogSuccess = () => { fetchList() }

onMounted(() => { fetchList() })
</script>

<style scoped>
.mail-recipient-manage { padding: 20px; background: white; border-radius: 8px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; color: #333; }
.header-actions { display: flex; gap: 10px; }
.search-bar { margin-bottom: 16px; }
.table-container { margin-bottom: 16px; }
.pagination-container { display: flex; justify-content: flex-end; }
</style>
