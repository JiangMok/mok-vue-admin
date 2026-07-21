<template>
  <div class="ai-prompt-config-manage">
    <div class="page-header">
      <h2>AI系统提示词配置</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus/></el-icon>
          新增配置
        </el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table :data="list" border stripe v-loading="loading" style="width: 100%">
<!--        <el-table-column prop="id" label="ID" width="280" show-overflow-tooltip />-->
        <el-table-column prop="aiAnalysisRequestType" label="请求类型" width="160" />
        <el-table-column prop="systemPrompt" label="系统提示词" min-width="260" show-overflow-tooltip />
        <el-table-column prop="createByName" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="info" size="small" @click="handleDetail(row)">详情</el-button>
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
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

    <AiPromptConfigDialog
      v-model:visible="dialogVisible"
      :is-edit="isEditMode"
      :readonly="isReadonly"
      :edit-data="currentEditData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { aiSystemPromptConfigApi } from '@/api'
import { formatDateTime } from '@/utils/formatter'
import type { AiSystemPromptConfig } from '@/types'
import AiPromptConfigDialog from './components/AiPromptConfigDialog.vue'

const loading = ref(false)
const list = ref<AiSystemPromptConfig[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const isEditMode = ref(false)
const isReadonly = ref(false)
const currentEditData = ref<AiSystemPromptConfig | null>(null)

const fetchList = async () => {
  try {
    loading.value = true
    const res = await aiSystemPromptConfigApi.getPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    if (res.code === 200) {
      list.value = res.data?.records || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.msg || '获取列表失败')
    }
  } catch {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEditMode.value = false
  isReadonly.value = false
  currentEditData.value = null
  dialogVisible.value = true
}

const handleEdit = (row: AiSystemPromptConfig) => {
  isEditMode.value = true
  isReadonly.value = false
  currentEditData.value = { ...row }
  dialogVisible.value = true
}

const handleDetail = (row: AiSystemPromptConfig) => {
  isEditMode.value = false
  isReadonly.value = true
  currentEditData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row: AiSystemPromptConfig) => {
  try {
    await ElMessageBox.confirm(`确定删除该提示词配置吗？`, '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    const res = await aiSystemPromptConfigApi.delete(row.id)
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

const handleDialogSuccess = () => { fetchList() }

onMounted(() => { fetchList() })
</script>

<style scoped>
.ai-prompt-config-manage { padding: 20px; background: white; border-radius: 8px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; color: #333; }
.header-actions { display: flex; gap: 10px; }
.table-container { margin-bottom: 16px; }
.pagination-container { display: flex; justify-content: flex-end; }
</style>
