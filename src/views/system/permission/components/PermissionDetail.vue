<template>
  <el-dialog
    v-model="dialogVisible"
    title="权限详情"
    width="700px"
    :before-close="handleClose"
  >
    <div class="detail-container">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="权限名称">
          <div class="detail-content">
            <div class="permission-name-display">
              <el-icon v-if="detailData.type === 1" class="type-icon">
                <Folder />
              </el-icon>
              <el-icon v-else-if="detailData.type === 2" class="type-icon">
                <Menu />
              </el-icon>
              <el-icon v-else class="type-icon">
                <Operation />
              </el-icon>
              {{ detailData.permissionName || '--' }}
            </div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="权限编码">
          <div class="detail-content">
            {{ detailData.permissionCode || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="权限描述">
          <div class="detail-content">
            {{ detailData.description || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="权限类型">
          <div class="detail-content">
            <el-tag :type="getTypeTagType(detailData.type)">
              {{ getTypeText(detailData.type) }}
            </el-tag>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="父级权限" v-if="detailData.parentId !== '0'">
          <div class="detail-content">
            {{ getParentPermissionName(detailData.parentId) || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="路由路径" v-if="detailData.type === 1 || detailData.type === 2">
          <div class="detail-content">
            {{ detailData.path || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="组件路径" v-if="detailData.type === 2">
          <div class="detail-content">
            {{ detailData.component || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="图标">
          <div class="detail-content">
            <div v-if="detailData.icon" class="icon-display">
              <el-icon :size="20">
                <component :is="detailData.icon" />
              </el-icon>
              <span class="icon-name">{{ detailData.icon }}</span>
            </div>
            <span v-else>--</span>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="显示排序">
          <div class="detail-content">
            {{ detailData.sort || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="显示状态">
          <div class="detail-content">
            <el-tag :type="detailData.visible === 1 ? 'success' : 'info'">
              {{ detailData.visible === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="启用状态">
          <div class="detail-content">
            <el-tag :type="detailData.status === 1 ? 'success' : 'danger'">
              {{ detailData.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="创建时间">
          <div class="detail-content">
            {{ formatDate(detailData.createTime) || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="更新时间">
          <div class="detail-content">
            {{ formatDate(detailData.updateTime) || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="删除状态">
          <div class="detail-content">
            <el-tag :type="detailData.isDeleted === 0 ? 'success' : 'danger'">
              {{ detailData.isDeleted === 0 ? '正常' : '已删除' }}
            </el-tag>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Folder, Menu, Operation } from '@element-plus/icons-vue'
import type {ApiPermission, PermissionItem} from '@/types'
import { permissionApi } from '@/api'

// 定义组件属性和事件
interface Props {
  visible: boolean
  tableData?: PermissionItem | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  tableData: null
})

const emit = defineEmits<Emits>()

// 数据定义
const detailData = reactive<PermissionItem>({
  id: '',
  permissionName: '',
  permissionCode: '',
  description: '',
  type: 1,
  parentId: '',
  icon: '',
  path: '',
  component: '',
  sort: 1,
  visible: 1,
  status: 1,
  isDeleted: 0,
  createTime: '',
  updateTime: ''
})

// 权限树数据（用于显示父级权限名称）
const permissionTree = ref<ApiPermission[]>([])

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 获取权限树
const fetchPermissionTree = async () => {
  try {
    const res = await permissionApi.getByUserId()
    // TODO: 根据实际接口响应结构调整
    permissionTree.value = res.data || []
  } catch (error) {
    console.error('获取权限树失败:', error)
  }
}

// 获取父级权限名称
const getParentPermissionName = (parentId: string) => {
  if (!parentId || parentId === '0') return ''

  const findPermission = (permissions: ApiPermission[]): string => {
    for (const permission of permissions) {
      if (permission.id === parentId) {
        return permission.permissionName
      }
      if (permission.children && permission.children.length > 0) {
        const result = findPermission(permission.children)
        if (result) return result
      }
    }
    return ''
  }

  return findPermission(permissionTree.value)
}

// 获取类型文本
const getTypeText = (type: number) => {
  const typeMap: Record<number, string> = {
    1: '目录',
    2: '菜单',
    3: '按钮'
  }
  return typeMap[type] || '未知'
}

// 获取类型标签样式
const getTypeTagType = (type: number) => {
  const typeMap: Record<number, string> = {
    1: 'primary',
    2: 'success',
    3: 'warning'
  }
  return typeMap[type] || 'info'
}

// 初始化详情数据
const initDetailData = () => {
  if (props.tableData) {
    Object.assign(detailData, props.tableData)
  }
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
    console.log('日期格式化失败:', error)
    return dateString
  }
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  // 重置数据
  Object.assign(detailData, {
    id: '',
    permissionName: '',
    permissionCode: '',
    description: '',
    type: 1,
    parentId: '',
    icon: '',
    path: '',
    component: '',
    sort: 1,
    visible: 1,
    status: 1,
    isDeleted: 0,
    createTime: '',
    updateTime: ''
  })
  permissionTree.value = []
}

// 监听对话框显示状态
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    // 对话框显示时，初始化数据
    initDetailData()
    // 获取权限树
    await fetchPermissionTree()
  }
})

// 监听表格数据变化
watch(() => props.tableData, (newVal) => {
  if (newVal && dialogVisible.value) {
    initDetailData()
  }
}, { deep: true })

// 组件挂载时初始化
onMounted(() => {
  // 预加载权限树
  fetchPermissionTree()
})
</script>

<style scoped>
.detail-container {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.detail-container::-webkit-scrollbar {
  width: 6px;
}

.detail-container::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 3px;
}

.detail-content {
  padding: 4px 0;
  min-height: 24px;
  display: flex;
  align-items: center;
}

.permission-name-display {
  display: flex;
  align-items: center;
}

.type-icon {
  margin-right: 8px;
  color: #409eff;
}

.icon-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-name {
  font-size: 14px;
  color: #666;
}

.empty-text {
  color: #999;
  font-style: italic;
}

:deep(.el-descriptions__body) {
  background-color: #fff;
}

:deep(.el-descriptions__label) {
  width: 100px;
  font-weight: 500;
}

:deep(.el-descriptions__content) {
  padding: 12px 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
