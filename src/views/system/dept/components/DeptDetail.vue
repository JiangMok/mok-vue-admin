<template>
  <el-dialog
    v-model="dialogVisible"
    title="部门详情"
    width="600px"
    :before-close="handleClose"
  >
    <div class="dept-detail-container" v-loading="loading">
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header"><h3>基本信息</h3></div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="部门ID">{{ deptInfo?.id || '--' }}</el-descriptions-item>
          <el-descriptions-item label="部门名称">{{ deptInfo?.deptName || '--' }}</el-descriptions-item>
          <el-descriptions-item label="部门编码">
            <el-tag size="small">{{ deptInfo?.deptCode || '--' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="deptInfo?.status === 1 ? 'success' : 'danger'" size="small">
              {{ deptInfo?.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ deptInfo?.leader || '--' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ deptInfo?.phone || '--' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ deptInfo?.email || '--' }}</el-descriptions-item>
          <el-descriptions-item label="排序">{{ deptInfo?.sort ?? '--' }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ deptInfo?.description || '--' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(deptInfo?.createTime) || '--' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">{{ formatDateTime(deptInfo?.updateTime) || '--' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleEdit" v-if="userStore.hasPermission('system:dept:edit')">编辑部门</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { deptApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { formatDateTime } from '@/utils/formatter'
import type { DeptItem } from '@/types'

interface Props {
  visible: boolean
  deptId: string
  deptData?: DeptItem
}
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'edit', deptId: string): void
}

const props = withDefaults(defineProps<Props>(), { visible: false, deptId: '', deptData: undefined })
const emit = defineEmits<Emits>()

const userStore = useUserStore()
const loading = ref(false)
const deptInfo = ref<DeptItem | null>(null)

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const fetchDeptDetail = async () => {
  if (props.deptData) {
    deptInfo.value = props.deptData
    return
  }
  if (!props.deptId) return
  try {
    loading.value = true
    const res = await deptApi.getById(props.deptId)
    if (res.code === 200) deptInfo.value = res.data
    else ElMessage.error(res.msg || '获取部门详情失败')
  } catch {
    ElMessage.error('获取部门详情失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  deptInfo.value = null
}

const handleEdit = () => {
  if (props.deptId) {
    emit('edit', props.deptId)
    handleClose()
  }
}

watch(() => props.visible, (newVal) => { if (newVal) fetchDeptDetail() })
watch(() => props.deptId, (newVal) => { if (newVal && props.visible) fetchDeptDetail() })
</script>

<style scoped>
.dept-detail-container { max-height: 60vh; overflow-y: auto; }
.info-card { border: 1px solid #e6e6e6; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #333; }
.dialog-footer { display: flex; justify-content: space-between; align-items: center; }
</style>
