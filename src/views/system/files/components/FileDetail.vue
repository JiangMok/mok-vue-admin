<template>
  <el-dialog
    v-model="visible"
    title="文件详情"
    width="600px"
    destroy-on-close
  >
    <div class="file-detail">
      <!-- 文件基本信息 -->
      <el-descriptions :column="1" border>
        <el-descriptions-item label="文件名">
          <div class="file-info-item">
            <el-icon v-if="fileData?.fileType === 'image'" class="type-icon">
              <Picture />
            </el-icon>
            <el-icon v-else-if="fileData?.fileType === 'video'" class="type-icon">
              <VideoCamera />
            </el-icon>
            <el-icon v-else-if="fileData?.fileType === 'document'" class="type-icon">
              <Document />
            </el-icon>
            <el-icon v-else class="type-icon">
              <Files />
            </el-icon>
            {{ fileData?.originalName }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="文件ID">{{ fileData?.fileId }}</el-descriptions-item>
        <el-descriptions-item label="文件类型">{{ getFileTypeText(fileData?.fileType) }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ formatFileSize(fileData?.fileSize) }}</el-descriptions-item>
        <el-descriptions-item label="MIME类型">{{ fileData?.mimeType }}</el-descriptions-item>
        <el-descriptions-item label="存储路径">{{ fileData?.filePath }}</el-descriptions-item>
        <el-descriptions-item label="访问URL">
          <el-link type="primary" :href="fileData?.fileUrl" target="_blank">
            {{ fileData?.fileUrl }}
          </el-link>
        </el-descriptions-item>
        <el-descriptions-item label="上传用户">{{ fileData?.uploadUserName || fileData?.uploadUserId }}</el-descriptions-item>
        <el-descriptions-item label="上传IP">{{ fileData?.uploadIp }}</el-descriptions-item>
        <el-descriptions-item label="下载次数">
          <el-tag type="info">{{ fileData?.downloadCount }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(fileData?.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(fileData?.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="fileData?.status === 1 ? 'success' : 'danger'">
            {{ fileData?.status === 1 ? '正常' : '已删除' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 预览区域（如果是图片） -->
      <div v-if="fileData?.fileType === 'image'" class="preview-section">
        <h4>预览</h4>
        <el-image
          :src="fileData?.fileUrl"
          fit="contain"
          style="width: 100%; max-height: 300px;"
          :preview-src-list="[fileData?.fileUrl]"
          :initial-index="0"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" @click="handleDownload">下载文件</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Picture, VideoCamera, Document, Files } from '@element-plus/icons-vue'
import type { FileItem } from '@/types'

interface Props {
  visible: boolean
  fileData: FileItem | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'download', file: FileItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 获取文件类型文本
const getFileTypeText = (fileType?: string) => {
  const typeMap: Record<string, string> = {
    'image': '图片',
    'video': '视频',
    'document': '文档',
    'other': '其他'
  }
  return fileType ? (typeMap[fileType] || '未知') : '--'
}

// 格式化文件大小
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '--'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '--'
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
    return dateString
  }
}

// 下载文件
const handleDownload = () => {
  if (props.fileData) {
    emit('download', props.fileData)
  }
}
</script>

<style scoped>
.file-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.file-info-item {
  display: flex;
  align-items: center;
}

.type-icon {
  margin-right: 8px;
  color: #409eff;
}

.preview-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.preview-section h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
