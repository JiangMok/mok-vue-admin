<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="handleClose"
    :title="title"
    width="700px"
    destroy-on-close
    top="5vh"
    class="ai-analysis-dialog"
  >
    <div class="analysis-body" v-loading="loading" element-loading-text="AI 正在分析中...">
      <!-- 错误状态 -->
      <el-alert
        v-if="error"
        title="分析失败"
        type="error"
        :description="error"
        show-icon
        :closable="false"
      />
      <!-- Markdown 渲染结果 -->
      <div
        v-else
        class="markdown-body"
        v-html="renderedMarkdown"
      />
    </div>

    <template #footer>
      <el-button @click="handleClose" :disabled="loading">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {computed, watch, onBeforeUnmount} from 'vue'
import {useAnalysisSSE} from '@/composables/useAnalysisSSE'
import {renderMarkdown} from '@/utils/markdown'

const props = withDefaults(defineProps<{
  modelValue: boolean
  analysisText: string
  apiEndpoint?: string
  title?: string
}>(), {
  apiEndpoint: 'http://localhost:8080/api/ai/analysis',
  title: 'AI 分析',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'analysis-done'): void
}>()

const {content, loading, error, start, stop} = useAnalysisSSE()

// 将累积文本转为安全的 HTML
const renderedMarkdown = computed(() => {

  if (!content.value) return ''
  return renderMarkdown(content.value)
})

// 监听对话框打开/关闭
watch(
  () => props.modelValue,
  async (val) => {
    if (val && props.analysisText) {
      // 获取 token（按你的认证方式调整）
      const token = localStorage.getItem('token') || ''
      await start(props.apiEndpoint, {content: props.analysisText}, token)
    } else {
      stop()
    }
  }
)

// 当内容完成且没有错误时，触发完成事件（仅示例，实际可根据需要）
watch(content, (val) => {
  if (val && !loading.value && !error.value) {
    emit('analysis-done')
  }
})
// 关闭对话框
const handleClose = () => {
  stop()
  emit('update:modelValue', false)
}

// 组件卸载时确保中断连接
onBeforeUnmount(stop)
</script>

<style scoped>
.ai-analysis-dialog :deep(.el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px;
}

.analysis-body {
  min-height: 200px;
}

/* Markdown 渲染样式（可引入 github-markdown-css 或自定义） */
.markdown-body {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  word-break: break-word;
}

.markdown-body :deep(pre) {
  background-color: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
  overflow-x: auto;
}

.markdown-body :deep(code) {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}
</style>
