<template>
  <div class="mqFailedMessage-manage">
    <div class="page-header">
      <h2>MQ失败消息</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="消息类型/队列/失败原因"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="处理状态">
          <el-select v-model="searchForm.params.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="全部" value="" />
            <el-option label="待处理" value="PENDING" />
            <el-option label="已处理" value="RESOLVED" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
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
        :data="messageList"
        border
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="messageId" label="消息ID" width="280" show-overflow-tooltip />
        <el-table-column prop="messageType" label="消息类型" width="140" show-overflow-tooltip />
        <el-table-column prop="originalQueue" label="原始队列" width="180" show-overflow-tooltip />
        <el-table-column prop="failReason" label="失败原因" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="处理状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'RESOLVED' ? 'success' : 'warning'">
              {{ row.status === 'RESOLVED' ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="retryCount" label="重试次数" width="90" align="center">
          <template #default="{ row }">
            {{ row.retryCount }} / {{ row.maxRetry }}
          </template>
        </el-table-column>
        <el-table-column prop="failedTime" label="失败时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.failedTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="270" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleDetail(row)"
            >
              详情
            </el-button>
            <el-button
              type="primary"
              size="small"
              :loading="analysisLoading"
              :disabled="analysisLoading"
              @click="openAnalysis(row)"
            >
              AI 分析
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handleResolve(row)"
              v-if="row.status !== 'RESOLVED' && userStore.hasPermission('system:mqFailedMessage:edit')"
            >
              处理
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="userStore.hasPermission('system:mqFailedMessage:delete')"
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="MQ失败消息详情" width="800px" destroy-on-close>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="消息ID" :span="2">{{ currentRow?.messageId }}</el-descriptions-item>
        <el-descriptions-item label="消息类型">{{ currentRow?.messageType }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="currentRow?.status === 'RESOLVED' ? 'success' : 'warning'">
            {{ currentRow?.status === 'RESOLVED' ? '已处理' : '待处理' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="原始队列">{{ currentRow?.originalQueue }}</el-descriptions-item>
        <el-descriptions-item label="死信队列">{{ currentRow?.deadQueue }}</el-descriptions-item>
        <el-descriptions-item label="死信交换机">{{ currentRow?.dlxExchange || '-' }}</el-descriptions-item>
        <el-descriptions-item label="死信路由键">{{ currentRow?.dlxRoutingKey || '-' }}</el-descriptions-item>
        <el-descriptions-item label="失败原因" :span="2">{{ currentRow?.failReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="重试次数">{{ currentRow?.retryCount }} / {{ currentRow?.maxRetry }}</el-descriptions-item>
        <el-descriptions-item label="原始时间">{{ formatDateTime(currentRow?.originalTimestamp) }}</el-descriptions-item>
        <el-descriptions-item label="失败时间">{{ formatDateTime(currentRow?.failedTime) }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentRow?.resolvedBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ formatDateTime(currentRow?.resolvedTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentRow?.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="消息体" :span="2">
          <div v-if="currentRow?.messageBody" class="json-viewer">
            <el-input
              type="textarea"
              :model-value="formatJson(currentRow.messageBody)"
              readonly
              :rows="10"
            />
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="xDeath头" :span="2">
          <div v-if="currentRow?.xDeathHeader" class="json-viewer">
            <el-input
              type="textarea"
              :model-value="formatJson(currentRow.xDeathHeader)"
              readonly
              :rows="8"
            />
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 处理弹窗 -->
    <el-dialog v-model="resolveVisible" title="标记已处理" width="500px" destroy-on-close>
      <el-form :model="resolveForm" label-width="80px">
        <el-form-item label="处理人">
          <el-input v-model="resolveForm.resolvedBy" placeholder="请输入处理人" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="resolveForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入处理备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResolve" :loading="resolveLoading">确认</el-button>
      </template>
    </el-dialog>

    <AiAnalysisDialog
      v-model="dialogVisible"
      :id="id"
      type="MQ_FAILED_MESSAGE"
    />
  </div>
</template>

<script setup lang="ts">
import type { MqFailedMessage } from '@/types'
import { onMounted, reactive, ref, watch } from 'vue'
import { useUserStore } from '@/stores/user.ts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mqFailedMessageApi } from '@/api'
import { formatDateTime, formatJson } from '@/utils/formatter'
import AiAnalysisDialog from "@/components/common/AiAnalysisDialog.vue";

const userStore = useUserStore()
const loading = ref(false)
const messageList = ref<MqFailedMessage[]>([])

const searchForm = reactive({
  keyword: '',
  params: {} as Record<string, any>
})

const timeRange = ref<[string, string] | null>(null)

const detailVisible = ref(false)
const currentRow = ref<MqFailedMessage | null>(null)

const resolveVisible = ref(false)
const resolveLoading = ref(false)
const resolveForm = reactive({
  resolvedBy: 'admin',
  remark: ''
})
const resolveTargetId = ref('')
const dialogVisible = ref(false)
const id = ref('')
const analysisLoading = ref(false)
function openAnalysis(row: any) {
  if (analysisLoading.value) return
  analysisLoading.value = true
  id.value = row.id
  dialogVisible.value = true
}

// 对话框关闭时重置 loading 状态
watch(dialogVisible, (val) => {
  if (!val) analysisLoading.value = false
})
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const fetchList = async () => {
  try {
    loading.value = true
    const params: Record<string, any> = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      params: { ...searchForm.params }
    }

    if (timeRange.value && timeRange.value.length === 2) {
      params.params.startTime = timeRange.value[0]
      params.params.endTime = timeRange.value[1]
    }

    Object.keys(params.params).forEach(key => {
      if (params.params[key] === '' || params.params[key] === undefined || params.params[key] === null) {
        delete params.params[key]
      }
    })
    if (Object.keys(params.params).length === 0) {
      delete params.params
    }

    const res = await mqFailedMessageApi.getPage(params)
    messageList.value = res.data.data || []
    pagination.total = res.data.total || 0
  } catch {
    ElMessage.error('获取MQ失败消息列表失败')
  } finally {
    loading.value = false
  }
}

const handleDetail = (row: MqFailedMessage) => {
  currentRow.value = row
  detailVisible.value = true
}

const handleResolve = (row: MqFailedMessage) => {
  resolveTargetId.value = row.id
  resolveForm.resolvedBy = 'admin'
  resolveForm.remark = ''
  resolveVisible.value = true
}

const submitResolve = async () => {
  try {
    resolveLoading.value = true
    await mqFailedMessageApi.resolve(resolveTargetId.value, {
      resolvedBy: resolveForm.resolvedBy,
      remark: resolveForm.remark
    })
    ElMessage.success('已标记为处理完成')
    resolveVisible.value = false
    fetchList()
  } catch {
    ElMessage.error('处理失败')
  } finally {
    resolveLoading.value = false
  }
}

const handleDelete = async (row: MqFailedMessage) => {
  try {
    await ElMessageBox.confirm(
      `确定删除该MQ失败消息吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await mqFailedMessageApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.params = {}
  timeRange.value = null
  pagination.pageNum = 1
  fetchList()
}

const handleSizeChange = () => {
  pagination.pageNum = 1
  fetchList()
}

const handlePageChange = () => {
  fetchList()
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.mqFailedMessage-manage {
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

.search-container .el-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
}

.search-container .el-form-item {
  margin: 0 !important;
}

.table-container {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}

.json-viewer :deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  background: #f5f7fa;
}
</style>
