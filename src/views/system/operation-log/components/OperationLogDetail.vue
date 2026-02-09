<template>
  <el-dialog
    v-model="dialogVisible"
    title="操作日志详情"
    width="800px"
    :before-close="handleClose"
  >
    <div v-loading="loading" class="log-detail-container">
      <div v-if="operationLogInfo" class="log-content">
        <!-- 基本信息 -->
        <el-descriptions title="基本信息" :column="2" border>
          <el-descriptions-item label="日志ID" label-align="right" align="left">
            {{ operationLogInfo.id }}
          </el-descriptions-item>
          <el-descriptions-item label="操作标题" label-align="right" align="left">
            {{ operationLogInfo.title }}
          </el-descriptions-item>
          <el-descriptions-item label="业务类型" label-align="right" align="left">
            <el-tag :type="getBusinessTypeTag(operationLogInfo.businessType)">
              {{ operationLogInfo.businessType }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="请求方式" label-align="right" align="left">
            <el-tag :type="getMethodTag(operationLogInfo.requestMethod)">
              {{ operationLogInfo.requestMethod }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作状态" label-align="right" align="left">
            <el-tag :type="operationLogInfo.status === 0 ? 'success' : 'danger'">
              {{ operationLogInfo.status === 0 ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作时间" label-align="right" align="left">
            {{ formatDateTime(operationLogInfo.operTime) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 操作者信息 -->
        <el-descriptions title="操作者信息" :column="2" border class="mt-4">
          <el-descriptions-item label="操作者" label-align="right" align="left">
            {{ operationLogInfo.operatorName || 'N/A' }}
          </el-descriptions-item>
<!--          <el-descriptions-item label="操作者ID" label-align="right" align="left">-->
<!--            {{ operationLogInfo.operatorId || 'N/A' }}-->
<!--          </el-descriptions-item>-->
<!--          <el-descriptions-item label="部门" label-align="right" align="left">-->
<!--            {{ operationLogInfo.deptName || 'N/A' }}-->
<!--          </el-descriptions-item>-->
          <el-descriptions-item label="操作类型" label-align="right" align="left">
            {{ getOperatorTypeText(operationLogInfo.operatorType) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 请求信息 -->
        <el-descriptions title="请求信息" :column="1" border class="mt-4">
          <el-descriptions-item label="请求URL" label-align="right" align="left">
            <div class="url-text">{{ operationLogInfo.operUrl }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="IP地址" label-align="right" align="left">
            <el-tag>{{ operationLogInfo.operIp }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作地点" label-align="right" align="left">
            {{ operationLogInfo.operLocation || '未知' }}
          </el-descriptions-item>
<!--          <el-descriptions-item label="调用方法" label-align="right" align="left">-->
<!--            <div class="method-text">{{ operationLogInfo.method }}</div>-->
<!--          </el-descriptions-item>-->
        </el-descriptions>

        <!-- 请求参数 -->
        <div class="param-section mt-4">
          <h4>请求参数</h4>
          <div class="code-block">
            <pre v-if="operationLogInfo.operParam">{{ formatJson(operationLogInfo.operParam) }}</pre>
            <div v-else class="empty-text">无请求参数</div>
          </div>
        </div>

        <!-- 返回结果 -->
        <div class="result-section mt-4">
          <h4>返回结果</h4>
          <div class="code-block">
            <pre>{{ parseJsonResult(operationLogInfo.jsonResult) }}</pre>
          </div>
        </div>

        <!-- 错误信息（如果有） -->
        <div v-if="operationLogInfo.errorMsg" class="error-section mt-4">
          <h4>错误信息</h4>
          <el-alert type="error" :title="operationLogInfo.errorMsg" :closable="false" />
        </div>

        <!-- 创建时间 -->
        <div class="time-section mt-4">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="操作时间" label-align="right" align="left">
              {{ formatDateTime(operationLogInfo.operTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" label-align="right" align="left">
              {{ formatDateTime(operationLogInfo.createTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <div v-else-if="!loading" class="empty-state">
        <el-empty description="未找到日志详情" />
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {ref, computed, watch} from 'vue'
import { ElMessage } from 'element-plus'
import type {OperationLog} from '@/types'
import {operationLogApi} from '@/api'
import {formatDateTime, formatJson,} from "@/utils/formatter.ts";

// 定义组件属性
interface Props {
  visible: boolean
  operationLogId: string
  operationLogData?: OperationLog
}

/**
 * withDefaults(): 为属性提供默认值
 *    当父组件没有传递这些属性时，将使用默认值：
 *    visible: 默认 false（组件默认隐藏）
 *    userId: 默认空字符串
 *    userData: 默认 undefined
 */
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  operationLogId: '',
  operationLogData: undefined
})

// 状态变量
//定义loading默认不显示
const loading = ref(false)
//定义operationLogInfo表格列的数据为OperationLog
const operationLogInfo = ref<OperationLog | null>(null)

// 定义组件事件
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'edit', userId: string): void
}
const emit = defineEmits<Emits>()
// 计算对话框是否可见
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// ================== 监听对话框显示 ==================
watch(() => props.visible, (newVal) => {
  // console.log("++++++++++++++++++++++++++  watch(() => props.visible, ",props.visible)
  if (newVal) {
    initData()
  }
})

// ================== 监听ID变化 ==================
watch(() => props.operationLogId, (newVal) => {
  // console.log("++++++++++++++++++++++++++  watch(() => props.operationLogId, ",props.operationLogId)
  if (newVal && props.visible) {
    initData()
  }
})
// ================== 初始化数据 ==================
const initData = async () => {
  // console.log("++++++++++++++++++++++++++  初始化数据 ")
  // console.log("props.visible:",props.visible)
  // console.log("props.operationLogId:",props.operationLogId)
  if (props.visible && props.operationLogId) {
    // 并行获取详情
    await Promise.all([
      fetchDetail()
    ])
  }
}
// ================== 获取详情 ==================
const fetchDetail = async () => {
  // 如果有传入的数据，直接使用
  if (props.operationLogData) {
    // console.log("++++++++++++++++++++++++++")
    // console.log(operationLogInfo)
    // console.log("++++++++++++++++++++++++++")
    operationLogInfo.value = props.operationLogData
  } else if (props.operationLogId) {
    // 否则根据用户ID获取详情
    try {
      loading.value = true
      const res = await operationLogApi.getOperationLogById(props.operationLogId)
      if (res.code === 200) {
        operationLogInfo.value = res.data
        // console.log("=========================")
        // console.log(operationLogInfo)
        // console.log("==========================")
      } else {
        ElMessage.error(res.msg || '获取用户详情失败1')
      }
    } catch (error) {
      console.error('获取用户详情失败:', error)
      ElMessage.error('获取用户详情失败2')
    } finally {
      loading.value = false
    }
  }
}

// 方法
const getBusinessTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    '查询': 'info',
    '新增': 'success',
    '修改': 'warning',
    '删除': 'danger',
    '导出': 'primary',
    '导入': 'primary',
    '授权': 'warning',
    '强退': 'danger',
    '清空': 'warning',
    '生成代码': 'success',
    '生成菜单': 'success',
    '其它': 'info'
  }
  return typeMap[type] || 'info'
}

const getMethodTag = (method: string) => {
  const methodMap: Record<string, string> = {
    'GET': 'success',
    'POST': 'info',
    'PUT': 'warning',
    'DELETE': 'danger',
    'PATCH': 'primary',
    'OPTIONS': 'info',
    'HEAD': 'info',
    'TRACE': 'info',
    'CONNECT': 'info'
  }
  return methodMap[method] || 'info'
}

const getOperatorTypeText = (type: number) => {
  const typeMap: Record<number, string> = {
    0: '其他',
    1: '后台用户',
    2: '手机端用户'
  }
  return typeMap[type] || '未知'
}

const parseJsonResult = (jsonString: string) => {
  try {
    // 尝试解析字符串化的JSON
    if (jsonString.startsWith('R{') && jsonString.endsWith('}')) {
      // 处理 Java toString() 格式
      return jsonString
        .replace(/R\{/, '{\n  ')
        .replace(/=/g, ': ')
        .replace(/, /g, ',\n  ')
        .replace(/\}/, '\n}')
    }

    // 尝试直接解析JSON
    const jsonObj = JSON.parse(jsonString)
    return JSON.stringify(jsonObj, null, 2)
  } catch (e) {
    // 如果解析失败，返回原字符串
    return jsonString
  }
}

// ================== 关闭对话框 ==================
const handleClose = () => {
  dialogVisible.value = false
  // 清空数据
  operationLogInfo.value = null
}

</script>

<style scoped>
.log-detail-container {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 8px;
}

.log-content {
  font-size: 14px;
}

.mt-4 {
  margin-top: 16px;
}

.url-text, .method-text {
  word-break: break-all;
  font-family: 'Consolas', 'Monaco', monospace;
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.code-block {
  background-color: #f8f8f8;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.code-block pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.empty-text {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.empty-state {
  padding: 40px 0;
}

h4 {
  margin: 0 0 8px 0;
  font-weight: 500;
  color: #333;
}

:deep(.el-descriptions__title) {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

:deep(.el-descriptions__label) {
  width: 120px;
}
</style>
