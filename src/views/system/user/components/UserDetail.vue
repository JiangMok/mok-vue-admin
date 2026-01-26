<template>
  <!-- 用户详情对话框 -->
  <el-dialog
    v-model="dialogVisible"
    title="用户详情"
    width="700px"
    :before-close="handleClose"
  >
    <div class="user-detail-container" v-loading="loading">
      <!-- 用户基本信息卡片 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <h3>基本信息</h3>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID" label-class-name="label-class">
            {{ userInfo?.id || '--' }}
          </el-descriptions-item>

          <el-descriptions-item label="用户名" label-class-name="label-class">
            {{ userInfo?.username || '--' }}
          </el-descriptions-item>

          <el-descriptions-item label="昵称" label-class-name="label-class">
            {{ userInfo?.nickname || '--' }}
          </el-descriptions-item>

          <el-descriptions-item label="状态" label-class-name="label-class">
            <el-tag :type="userInfo?.status === 1 ? 'success' : 'danger'" size="small">
              {{ userInfo?.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="手机号" label-class-name="label-class">
            {{ userInfo?.phone || '--' }}
          </el-descriptions-item>

          <el-descriptions-item label="邮箱" label-class-name="label-class">
            {{ userInfo?.email || '--' }}
          </el-descriptions-item>

          <el-descriptions-item label="创建时间" label-class-name="label-class" :span="2">
            {{ formatDateTime(userInfo?.createTime) || '--' }}
          </el-descriptions-item>

          <el-descriptions-item label="更新时间" label-class-name="label-class" :span="2">
            {{ formatDateTime(userInfo?.updateTime) || '--' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 角色信息卡片 -->
      <el-card shadow="never" class="roles-card">
        <template #header>
          <div class="card-header">
            <h3>角色信息</h3>
            <el-tag type="info" size="small">
              共 {{ roles.length }} 个角色
            </el-tag>
          </div>
        </template>

        <!-- 角色列表 -->
        <div class="roles-list" v-if="roles.length > 0">
          <el-table :data="roles" border stripe style="width: 100%">
            <el-table-column prop="roleName" label="角色名称" width="120">
              <template #default="{ row }">
                <span class="role-name">{{ row.roleName }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="roleCode" label="角色编码" width="120">
              <template #default="{ row }">
                <el-tag type="info" size="small">{{ row.roleCode }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="description" label="描述" min-width="180">
              <template #default="{ row }">
                <span class="role-description">{{ row.description || '暂无描述' }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="createTime" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 无角色提示 -->
        <div class="empty-roles" v-else>
          <el-empty description="该用户尚未分配任何角色" :image-size="80" />
        </div>
      </el-card>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleEdit" v-if="userStore.hasPermission('system:user:edit')">
          编辑用户
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { UserInfo, RoleItem } from '@/types'
import {roleApi, userApi} from '@/api'
import { useUserStore } from '@/stores/user'
import {formatDateTime} from "@/utils/formatter.ts";

// 定义组件属性
interface Props {
  visible: boolean
  userId: string
  userData?: UserInfo // 可选的用户数据，如果有就不需要重新获取
}



const props = withDefaults(defineProps<Props>(), {
  visible: false,
  userId: '',
  userData: undefined
})

// 定义组件事件
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'edit', userId: string): void
}

const emit = defineEmits<Emits>()

// 使用用户store
const userStore = useUserStore()

// 状态变量
const loading = ref(false)
const userInfo = ref<UserInfo | null>(null)
const roles = ref<RoleItem[]>([])

// 计算对话框是否可见
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})


// ================== 获取用户详情 ==================
const fetchUserDetail = async () => {
  // 如果有传入的用户数据，直接使用
  if (props.userData) {
    userInfo.value = props.userData
  } else if (props.userId) {
    // 否则根据用户ID获取详情
    try {
      loading.value = true
      const res = await userApi.getUserById(props.userId)
      if (res.code === 200) {
        userInfo.value = res.data
      } else {
        ElMessage.error(res.msg || '获取用户详情失败')
      }
    } catch (error) {
      console.error('获取用户详情失败:', error)
      ElMessage.error('获取用户详情失败')
    } finally {
      loading.value = false
    }
  }
}

// ================== 获取用户角色 ==================
const fetchUserRoles = async () => {
  if (!props.userId) return

  try {
    loading.value = true
    const res = await roleApi.getUserRoles(props.userId)
    if (res.code === 200) {
      roles.value = res.data || []
    } else {
      ElMessage.error(res.msg || '获取用户角色失败')
    }
  } catch (error) {
    console.error('获取用户角色失败:', error)
    ElMessage.error('获取用户角色失败')
  } finally {
    loading.value = false
  }
}

// ================== 初始化数据 ==================
const initData = async () => {
  if (props.visible && props.userId) {
    // 并行获取用户详情和角色信息
    await Promise.all([
      fetchUserDetail(),
      fetchUserRoles()
    ])
  }
}

// ================== 关闭对话框 ==================
const handleClose = () => {
  dialogVisible.value = false
  // 清空数据
  userInfo.value = null
  roles.value = []
}

// ================== 编辑用户 ==================
const handleEdit = () => {
  if (props.userId) {
    emit('edit', props.userId)
    handleClose()
  }
}

// ================== 监听对话框显示 ==================
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initData()
  }
})

// ================== 监听用户ID变化 ==================
watch(() => props.userId, (newVal) => {
  if (newVal && props.visible) {
    initData()
  }
})
</script>

<style scoped>
.user-detail-container {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 5px;
}

.user-detail-container::-webkit-scrollbar {
  width: 6px;
}

.user-detail-container::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.info-card,
.roles-card {
  margin-bottom: 20px;
  border: 1px solid #e6e6e6;
}

.info-card:last-child,
.roles-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  background-color: #f8f9fa;
}

:deep(.el-descriptions__content) {
  color: #666;
}

.role-name {
  font-weight: 500;
  color: #333;
}

.role-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.empty-roles {
  padding: 20px 0;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer .el-button:first-child {
  margin-right: 10px;
}
</style>
