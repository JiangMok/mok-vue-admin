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
      <!-- Markdown 渲染结果，包在固定高度的滚动容器中 -->
      <div v-else class="markdown-scroll-area">
        <div
          class="markdown-body"
          v-html="renderedMarkdown"
        />
      </div>
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
  id: string                 // 替换 analysisText
  type: 'OPERATION_LOG' | 'MQ_FAILED_MESSAGE'  // 新增，限制合法值
  apiEndpoint?: string
  title?: string
}>(), {
  apiEndpoint: import.meta.env.PROD
    ? '/api/ai/analysis'
    : `${import.meta.env.VITE_API_BASE_URL || '/api'}/ai/analysis`,
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
    if (val && props.id && props.type) {
      const token = localStorage.getItem('token') || ''
      await start(props.apiEndpoint, {
        id: props.id,
        type: props.type
      }, token)
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
/* ========== 内容滚动区域（自己掌控，不依赖 :deep() 穿透） ========== */
.markdown-scroll-area {
  max-height: 60vh;
  overflow-y: auto;
  padding: 4px 4px 4px 0;
}

.analysis-body {
  min-height: 200px;
}

/* ========== Markdown 渲染样式 ========== */
.markdown-body {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  word-break: break-word;
}

/* 标题 */
.markdown-body :deep(h1) {
  font-size: 1.5em;
  font-weight: 700;
  margin: 0.8em 0 0.5em;
  padding-bottom: 0.3em;
  border-bottom: 2px solid #e8e8e8;
  color: #1a1a1a;
}
.markdown-body :deep(h2) {
  font-size: 1.3em;
  font-weight: 700;
  margin: 0.75em 0 0.45em;
  padding-bottom: 0.25em;
  border-bottom: 1px solid #eee;
  color: #1a1a1a;
}
.markdown-body :deep(h3) {
  font-size: 1.15em;
  font-weight: 600;
  margin: 0.7em 0 0.4em;
  color: #333;
}
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  font-size: 1em;
  font-weight: 600;
  margin: 0.6em 0 0.35em;
  color: #444;
}

/* 段落 */
.markdown-body :deep(p) {
  margin: 0.5em 0;
}

/* 行内代码 */
.markdown-body :deep(code) {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  color: #d63384;
}

/* 代码块 */
.markdown-body :deep(pre) {
  background-color: #f5f7fa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  margin: 0.6em 0;
  line-height: 1.5;
}
.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
  color: inherit;
  font-size: 13px;
}

/* 无序列表 */
.markdown-body :deep(ul) {
  padding-left: 1.5em;
  margin: 0.4em 0;
}
.markdown-body :deep(ul li) {
  list-style: disc;
  margin: 0.2em 0;
}

/* 有序列表 */
.markdown-body :deep(ol) {
  padding-left: 1.5em;
  margin: 0.4em 0;
}
.markdown-body :deep(ol li) {
  list-style: decimal;
  margin: 0.2em 0;
}

/* 引用块 */
.markdown-body :deep(blockquote) {
  margin: 0.6em 0;
  padding: 8px 16px;
  border-left: 4px solid #409eff;
  background-color: #f0f7ff;
  color: #555;
  border-radius: 0 6px 6px 0;
}
.markdown-body :deep(blockquote p) {
  margin: 0.3em 0;
}

/* 表格 */
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.6em 0;
  font-size: 13px;
}
.markdown-body :deep(th) {
  background-color: #f5f7fa;
  font-weight: 600;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  text-align: left;
}
.markdown-body :deep(td) {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
}
.markdown-body :deep(tr:nth-child(even)) {
  background-color: #fafafa;
}
.markdown-body :deep(tr:hover) {
  background-color: #f0f7ff;
}

/* 分割线 */
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #e8e8e8;
  margin: 1em 0;
}

/* 链接 */
.markdown-body :deep(a) {
  color: #409eff;
  text-decoration: none;
}
.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

/* 图片 */
.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 0.4em 0;
}

/* 加粗 / 斜体 */
.markdown-body :deep(strong) {
  font-weight: 700;
  color: #222;
}
.markdown-body :deep(em) {
  font-style: italic;
}
</style>
