<template>
  <div class="file-manage">
    <div class="page-header">
      <h2>文件管理</h2>
      <div class="header-actions">
        <!-- 直接上传文件按钮 -->
        <el-button
          type="primary"
          @click="handleUploadDialogOpen"
          v-if="userStore.hasPermission('system:files:upload')"
        >
          <el-icon>
            <Upload />
          </el-icon>
          上传文件
        </el-button>

        <!-- 批量删除按钮 -->
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="selectedRows.length === 0"
          v-if="userStore.hasPermission('system:files:delete')"
        >
          <el-icon>
            <Delete />
          </el-icon>
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
        <el-form-item label="文件名">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入文件名"
            clearable
          />
        </el-form-item>
        <el-form-item label="文件类型">
          <el-select v-model="searchForm.params.fileType" placeholder="请选择文件类型" clearable
                     style="width: 200px">
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
            <el-option label="文档" value="document" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传用户">
          <el-input
            v-model="searchForm.params.uploadUserId"
            placeholder="请输入上传用户ID"
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
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />

        <el-table-column prop="originalName" label="文件名" min-width="200">
          <template #default="{ row }">
            <div class="file-name-cell">
              <el-icon v-if="row.fileType === 'image'" class="type-icon">
                <Picture />
              </el-icon>
              <el-icon v-else-if="row.fileType === 'video'" class="type-icon">
                <VideoPlay />
              </el-icon>
              <el-icon v-else-if="row.fileType === 'document'" class="type-icon">
                <Document />
              </el-icon>
              <el-icon v-else class="type-icon">
                <Files />
              </el-icon>
              <span class="file-name" :title="row.originalName">
                {{ truncateText(row.originalName, 30) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="fileType" label="文件类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getFileTypeTagType(row.fileType)">
              {{ getFileTypeText(row.fileType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="businessType" label="业务类型" width="100">
          <template #default="{ row }">
<!--            <el-tag :type="getBusinessType(row.businessType)">-->
              {{ formatBusinessType(row.businessType) }}
<!--            </el-tag>-->
          </template>
        </el-table-column>

        <el-table-column prop="fileSize" label="文件大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>

        <el-table-column prop="uploadUserId" label="上传用户" width="120">
          <template #default="{ row }">
            {{ row.uploadUserName || row.uploadUserId }}
          </template>
        </el-table-column>

        <el-table-column prop="downloadCount" label="下载次数" width="100">
          <template #default="{ row }">
            <el-tag type="info">
              {{ row.downloadCount }}
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
            <!-- 预览按钮 -->
            <el-button
              type="primary"
              size="small"
              @click="handlePreview(row)"
              v-if="row.fileType === 'image' || row.fileType === 'document'"
            >
              预览
            </el-button>

            <!-- 下载按钮 -->
            <el-button
              type="success"
              size="small"
              @click="handleDownload(row)"
            >
              下载
            </el-button>

            <!-- 删除按钮 -->
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="userStore.hasPermission('system:files:delete')"
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

    <!-- 上传文件对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传文件"
      width="500px"
      :before-close="handleUploadDialogClose"
    >
      <div class="upload-dialog">
        <!-- 文件选择区域 -->
        <div class="upload-area" @click="triggerFileInput" :class="{ 'drag-over': isDragOver }"
             @dragover.prevent="handleDragOver"
             @dragleave.prevent="handleDragLeave"
             @drop.prevent="handleDrop">
          <el-icon size="60" color="#409EFF">
            <Upload />
          </el-icon>
          <p class="upload-text">点击或拖拽文件到此处上传</p>
          <p class="upload-hint">支持图片、文档、视频等文件，最大10MB</p>
        </div>

        <!-- 文件信息显示 -->
        <div v-if="selectedFile" class="file-info">
          <div class="file-info-item">
            <el-icon><Document /></el-icon>
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
          </div>
          <div class="file-info-actions">
            <el-button type="danger" size="small" @click="removeFile">移除</el-button>
          </div>
        </div>

        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInputRef"
          type="file"
          style="display: none"
          @change="handleFileSelect"
        />

        <!-- 上传选项 -->
        <div class="upload-options">
          <el-form :model="uploadForm" label-width="80px">
            <el-form-item label="业务类型">
              <el-select v-model="uploadForm.businessType" placeholder="请选择业务类型" clearable>
                <el-option label="通用文件" value="general" />
                <el-option label="用户头像" value="1" />
                <el-option label="产品图片" value="product" />
                <el-option label="合同文档" value="contract" />
              </el-select>
            </el-form-item>
            <el-form-item label="业务ID">
              <el-input v-model="uploadForm.businessId" placeholder="可选，关联业务ID" />
            </el-form-item>
            <el-form-item label="文件描述">
              <el-input v-model="uploadForm.description" type="textarea" placeholder="可选，文件描述" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleUploadSubmit"
            :disabled="!selectedFile"
            :loading="uploading"
          >
            上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="文件预览"
      width="70%"
      top="5vh"
      destroy-on-close
    >
      <div class="preview-content">
        <div v-if="currentFile?.fileType === 'image'" class="image-preview">
          <el-image
            :src="currentFile?.fileUrl"
            fit="contain"
            style="max-width: 100%; max-height: 70vh;"
            :preview-src-list="[currentFile?.fileUrl]"
            :initial-index="0"
          />
        </div>
        <div v-else class="other-preview">
          <div class="no-preview">
            <el-icon size="100">
              <Files />
            </el-icon>
            <p class="no-preview-text">该文件类型暂不支持在线预览</p>
            <p>文件名：{{ currentFile?.originalName }}</p>
            <p>文件大小：{{ formatFileSize(currentFile?.fileSize || 0) }}</p>
            <p>文件类型：{{ currentFile?.mimeType }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="preview-footer">
          <el-button @click="previewDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleDownload(currentFile)">
            下载文件
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload, Delete, Picture, VideoPlay, Document, Files
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user.ts'
import type { FileItem } from '@/types'
import { fileApi } from '@/api'

// 使用userStore验证权限
const userStore = useUserStore()

// 加载状态
const loading = ref(false)

// 文件列表
const tableList = ref<FileItem[]>([])

// 选中的行
const selectedRows = ref<FileItem[]>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  params: {
    fileType: undefined as string | undefined,
    uploadUserId: undefined as string | undefined
  }
})

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 上传相关
const uploadDialogVisible = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const isDragOver = ref(false)
const uploading = ref(false)

// 上传表单
const uploadForm = reactive({
  businessType: 'general',
  businessId: '',
  description: ''
})

// 预览相关
const currentFile = ref<FileItem | null>(null)
const previewDialogVisible = ref(false)

// 获取文件列表
const fetchList = async () => {
  try {
    loading.value = true

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

    const res = await fileApi.getPage(params)
    // console.log('文件列表响应:', res)
    tableList.value = res.data?.data || []
    pagination.total = res.data?.total || 0

  } catch (error) {
    // console.error('获取文件列表失败:', error)
    ElMessage.error('获取文件列表失败')
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
  searchForm.keyword = ''
  searchForm.params.fileType = undefined
  searchForm.params.uploadUserId = undefined
  pagination.pageNum = 1
  fetchList()
}

// 选择行变化
const handleSelectionChange = (rows: FileItem[]) => {
  selectedRows.value = rows
}

// 打开上传对话框
const handleUploadDialogOpen = () => {
  uploadDialogVisible.value = true
  // 重置上传状态
  selectedFile.value = null
  isDragOver.value = false
  uploadForm.businessType = 'general'
  uploadForm.businessId = ''
  uploadForm.description = ''
}

// 关闭上传对话框
const handleUploadDialogClose = (done: () => void) => {
  if (selectedFile.value && !uploading.value) {
    ElMessageBox.confirm('文件未上传，确定要关闭吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      done()
    }).catch(() => {
      // 取消关闭
    })
  } else {
    done()
  }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const file = input.files[0]
    // 确保文件存在
    if (file) {
      validateAndSetFile(file)
    } else {
      // 处理文件不存在的情况
      ElMessage.warning('请选择文件')
    }
    // 清空input值，允许重复选择相同文件
    input.value = ''
  }
}

// 验证并设置文件
const validateAndSetFile = (file: File) => {
  // 文件大小限制（10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过10MB')
    return
  }

  // 文件类型限制
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]

  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('不支持的文件类型')
    return
  }

  selectedFile.value = file
}

// 移除文件
const removeFile = () => {
  selectedFile.value = null
}

// 拖拽相关
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  if (event.dataTransfer?.files.length) {
    const file = event.dataTransfer.files[0]
    // 确保文件存在
    if (file) {
      validateAndSetFile(file)
    } else {
      // 处理文件不存在的情况
      ElMessage.warning('请选择文件')
    }
  }
}

// 提交上传
const handleUploadSubmit = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  try {
    uploading.value = true

    // 创建FormData
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('businessType', uploadForm.businessType)

    if (uploadForm.businessId) {
      formData.append('businessId', uploadForm.businessId)
    }

    if (uploadForm.description) {
      formData.append('description', uploadForm.description)
    }

    // 调用上传API
    const res = await fileApi.upload(formData)
    // console.log('上传响应:', res)

    if (res.code === 200) {
      ElMessage.success('文件上传成功')
      uploadDialogVisible.value = false
      fetchList() // 刷新列表
    } else {
      ElMessage.error(res.msg || '上传失败')
    }
  } catch (error) {
    // console.error('上传失败:', error)
    ElMessage.error('文件上传失败')
  } finally {
    uploading.value = false
  }
}

// 预览文件
const handlePreview = (row: FileItem) => {
  currentFile.value = row

  // 不再硬编码 localhost:8080，直接使用 row.fileUrl
  // 假设后端已返回完整的文件URL
  // console.log('预览文件URL:', row.fileUrl)
  previewDialogVisible.value = true
}

// 下载文件
const handleDownload = async (row: FileItem | null) => {
  if (!row) return

  try {
    // 方法1：直接通过后端返回的URL下载
    const link = document.createElement('a')
    link.href = row.fileUrl
    link.download = row.originalName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 如果需要，可以调用后端API更新下载次数
    await fileApi.updateDownloadCount(row.id)

    // 刷新列表
    fetchList()

  } catch (error) {
    // console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

// 删除文件
const handleDelete = async (row: FileItem) => {
  try {
    await ElMessageBox.confirm(
      `确定删除文件 "${row.originalName}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await fileApi.deleteFile(row.id)
    ElMessage.success('删除成功')
    fetchList()

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的文件')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 个文件吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedRows.value.map(row => row.id)
    await fileApi.batchDelete(ids)
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    fetchList()

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

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

// 获取文件类型文本
const getFileTypeText = (fileType: string) => {
  const typeMap: Record<string, string> = {
    'image': '图片',
    'video': '视频',
    'document': '文档',
    'other': '其他'
  }
  return typeMap[fileType] || '未知'
}

// 获取文件类型标签样式
const getFileTypeTagType = (fileType: string) => {
  const typeMap: Record<string, string> = {
    'image': 'primary',
    'video': 'success',
    'document': 'warning',
    'other': 'info'
  }
  return typeMap[fileType] || 'info'
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

// 截断文本
const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 页面加载
onMounted(() => {
  fetchList()
})

const formatBusinessType = (type: number) => {
  const typeMap: Record<number, string> = {
    0: '其他',
    1: '用户头像',
    2: '文件管理上传'
  }
  return typeMap[type] || '未知'
}
const getBusinessType = (type: number) => {
  const typeMap: Record<number, string> = {
    0: 'info',
    1: 'primary'
  }
  return typeMap[type] || 'info'
}
</script>

<style scoped>
.file-manage {
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

.header-actions {
  display: flex;
  gap: 10px;
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

.file-name-cell {
  display: flex;
  align-items: center;
}

.type-icon {
  margin-right: 8px;
  color: #409eff;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 上传对话框样式 */
.upload-dialog {
  padding: 10px;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-area.drag-over {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin: 10px 0;
}

.upload-hint {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.file-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  font-weight: 500;
}

.file-size {
  color: #909399;
  font-size: 14px;
}

.upload-options {
  margin-top: 20px;
}

/* 预览样式 */
.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.no-preview {
  text-align: center;
  color: #666;
}

.no-preview-text {
  margin: 20px 0;
  font-size: 18px;
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
