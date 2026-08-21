<template>
  <div class="mailLog-manage">
    <div class="page-header">
      <h2>邮件日志</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="收件人/主题"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="发送状态">
          <el-select v-model="searchForm.params.sendStatus" placeholder="全部" clearable style="width: 130px">
            <el-option label="全部" value="" />
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
          </el-select>
        </el-form-item>

        <el-form-item label="邮件类型">
          <el-select v-model="searchForm.params.mailType" placeholder="全部" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="系统检查" value="SYSTEM_CHECK" />
            <el-option label="告警" value="ALERT" />
            <el-option label="通知" value="NOTIFICATION" />
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
        :data="mailLogList"
        border
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="messageId" label="消息ID" width="280" show-overflow-tooltip />
        <el-table-column prop="recipient" label="收件人" width="200" show-overflow-tooltip />
        <el-table-column prop="subject" label="主题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="mailType" label="邮件类型" width="120" />
        <el-table-column prop="sendStatus" label="发送状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.sendStatus === 'SUCCESS' ? 'success' : 'danger'">
              {{ row.sendStatus === 'SUCCESS' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="retryCount" label="重试次数" width="90" align="center" />
        <el-table-column prop="sendTime" label="发送时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.sendTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleDetail(row)"
            >
              详情
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="userStore.hasPermission('system:mailLog:delete')"
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
    <el-dialog v-model="detailVisible" title="邮件日志详情" width="700px" destroy-on-close>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="消息ID" :span="2">{{ currentRow?.messageId }}</el-descriptions-item>
        <el-descriptions-item label="收件人">{{ currentRow?.recipient }}</el-descriptions-item>
        <el-descriptions-item label="邮件类型">{{ currentRow?.mailType }}</el-descriptions-item>
        <el-descriptions-item label="主题" :span="2">{{ currentRow?.subject }}</el-descriptions-item>
        <el-descriptions-item label="发送状态">
          <el-tag :type="currentRow?.sendStatus === 'SUCCESS' ? 'success' : 'danger'">
            {{ currentRow?.sendStatus === 'SUCCESS' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="重试次数">{{ currentRow?.retryCount }}</el-descriptions-item>
        <el-descriptions-item label="失败原因" :span="2">
          {{ currentRow?.failReason || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="发送时间">{{ formatDateTime(currentRow?.sendTime) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentRow?.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="邮件内容" :span="2">
          <div class="content-preview" v-if="currentRow?.content">
            <el-input
              type="textarea"
              :model-value="currentRow.content"
              readonly
              :rows="10"
            />
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { MailLog } from '@/types'
import { onMounted, reactive, ref } from 'vue'
import { useUserStore } from '@/stores/user.ts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mailLogApi } from '@/api'
import { formatDateTime } from '@/utils/formatter'

const userStore = useUserStore()
const loading = ref(false)
const mailLogList = ref<MailLog[]>([])

const searchForm = reactive({
  keyword: '',
  params: {} as Record<string, any>
})

const timeRange = ref<[string, string] | null>(null)

const detailVisible = ref(false)
const currentRow = ref<MailLog | null>(null)

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const fetchList = async () => {
  try {
    loading.value = true
    const params: {
      pageNum: number
      pageSize: number
      keyword?: string
      params?: Record<string, any>
    } = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      params: { ...searchForm.params }
    }

    // 处理时间范围
    if (timeRange.value && timeRange.value.length === 2) {
      params.params!.startTime = timeRange.value[0]
      params.params!.endTime = timeRange.value[1]
    }

    // 清除空值
    Object.keys(params.params!).forEach(key => {
      if (params.params![key] === '' || params.params![key] === undefined || params.params![key] === null) {
        delete params.params![key]
      }
    })
    if (Object.keys(params.params!).length === 0) {
      delete params.params
    }

    const res = await mailLogApi.getPage(params)
    mailLogList.value = res.data.data || []
    pagination.total = res.data.total || 0
  } catch {
    ElMessage.error('获取邮件日志列表失败')
  } finally {
    loading.value = false
  }
}

const handleDetail = (row: MailLog) => {
  currentRow.value = row
  detailVisible.value = true
}

const handleDelete = async (row: MailLog) => {
  try {
    await ElMessageBox.confirm(
      `确定删除该邮件日志吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await mailLogApi.delete(row.id)
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
.mailLog-manage {
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

.content-preview {
  width: 100%;
}
</style>
