<template>
  <el-dialog
    v-model="dialogVisible"
    title="角色详情"
    width="600px"
    :before-close="handleClose"
  >
    <div class="detail-container">
      <el-descriptions :column="1" border>
        <!-- ******* 数据传递 ---(共8步,1-2在父组件,3-8在子组件)-->
        <!-- |-7.显示的是哪里的数据-->
        <!-- |--显示的是detailData对象中的数据-->
        <!-- |--这个detailData对象的是通过<<数据传递6②>>的方式初始化的-->
        <el-descriptions-item label="角色名称">
          <div class="detail-content">
            {{ detailData.roleName || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="角色编码">
          <div class="detail-content">
            {{ detailData.roleCode || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="角色描述">
          <div class="detail-content">
            {{ detailData.description || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="角色排序">
          <div class="detail-content">
            {{ detailData.sort || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="状态">
          <div class="detail-content">
            <el-tag :type="detailData.status === 1 ? 'success' : 'danger'">
              {{ detailData.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="创建时间">
          <div class="detail-content">
            {{ formatDateTime(detailData.createTime) || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="更新时间">
          <div class="detail-content">
            {{ formatDateTime(detailData.updateTime) || '--' }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="权限列表" v-if="permissionList.length > 0">
          <div class="permission-container">
            <div class="permission-list">
              <div
                v-for="permission in permissionList"
                :key="permission.id"
                class="permission-item"
              >
                <div class="permission-info">
                  <span class="permission-name">{{ permission.permissionName }}</span>
                  <div class="permission-tags">
                    <el-tag size="small" type="info">{{ permission.permissionCode }}</el-tag>
                    <el-tag
                      size="small"
                      :type="permission.status === 1 ? 'success' : 'danger'"
                    >
                      {{ permission.status === 1 ? '启用' : '禁用' }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
            <div class="permission-count" v-if="permissionList.length > 0">
              共 {{ permissionList.length }} 个权限
            </div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="权限列表" v-else>
          <div class="detail-content">
            <span class="empty-text">暂无权限</span>
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
import {computed, onMounted, reactive, ref, watch} from 'vue'
import {ElMessage} from 'element-plus'
import type {ApiPermission, RoleItem} from '@/types'
import {permissionApi} from '@/api'
import {formatDateTime} from "@/utils/formatter.ts";

// 定义组件属性和事件
//******* 数据传递(共8步)
// |-3.子组件接收数据
// |--父组件中引用子组件template代码中的冒号(:)后边的属性
// |---visible: boolean   >>> 接收visible
// |---tableId?: string   >>> 接收tableId
// |---tableData?: RoleItem | null >>> 接收tableData
interface Props {
  visible: boolean
  tableId?: string
  tableData?: RoleItem | null
}

//******* 数据传递(共8步)
// |-4.给子组件接收数据一个默认值
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  tableId: '',
  tableData: null
})


interface Emits {
  (e: 'update:visible', value: boolean): void
}


const emit = defineEmits<Emits>()


const permissionList = ref<ApiPermission[]>([])
const loading = ref(false)
//******* 数据传递 ---(共8步,1-2在父组件,3-8在子组件)
// |-5.①用什么接收数据 --- 计算属性
// |--计算属性接收
// |---get: () => props.visible,   >>> 从props读取
// |---set: (value) => emit('update:visible', value)   >>> 向父组件发射
// |-6.①接收的数据给了谁
// |--props.visible → dialogVisible (控制对话框显示)
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})
//******* 数据传递 ---(共8步,1-2在父组件,3-8在子组件)
// |-5.②用什么接收数据 --- 响应式数据
// |--用于存储和显示
const detailData = reactive<RoleItem>({
  id: '',
  roleName: '',
  roleCode: '',
  description: '',
  isDeleted: -1,
  sort: 1,
  status: 1,
  createTime: '',
  updateTime: ''
})

// 方法定义
/**
 * 初始化详情数据
 */
const initDetailData = async () => {
  if (props.tableData) {
    // 如果直接传递了表格数据，直接使用
    // ******* 数据传递 ---(共8步,1-2在父组件,3-8在子组件)
    // |-6.②接收的数据给了谁
    // |--props.tableId 和 props.tableData
    // |---          传递给 initDetailData()方法  后各自使用:
    // |---          props.tableData 传递给 detailData(template使用 {{ detailData.xxx }}来获取某一属性,
    //                                                                      从而就能获取到属性对应的数据)
    // |---          props.tableId 传递给 下面的if语句用于后续操作
    Object.assign(detailData, props.tableData)
    // 获取权限列表
    if (props.tableData.id) {
      await fetchRolePermission(props.tableData.id)
    }
  } else if (props.tableId) {
    // 如果只有ID，需要根据ID获取详情
    // 注意：这里假设有根据ID获取角色详情的API
    // 由于列表页面已经传递了tableData，这里主要作为备用
    console.warn('需要通过ID获取角色详情，但当前缺少相关API')
    await fetchRolePermission(props.tableId)
  }
}

/**
 * 获取角色权限信息
 */
const fetchRolePermission = async (roleId: string) => {
  try {
    loading.value = true
    const res = await permissionApi.getByRoleId(roleId)
    if (res.code === 200 && res.data) {
      permissionList.value = res.data
    } else {
      console.warn('获取角色权限失败:', res.msg)
      permissionList.value = []
    }
  } catch (error) {
    console.error('获取角色权限失败:', error)
    ElMessage.error('获取角色权限失败')
    permissionList.value = []
  } finally {
    loading.value = false
  }
}


/**
 * 关闭对话框
 */
const handleClose = () => {
  dialogVisible.value = false
  // 重置数据
  Object.keys(detailData).forEach(key => {
    if (key !== 'id') {
      detailData[key] = ''
    }
  })
  detailData.id = ''
  detailData.sort = 1
  detailData.status = 1
  permissionList.value = []
}

/**
 * 监听对话框显示状态
 */
// ******* 数据传递 ---(共8步,1-2在父组件,3-8在子组件)
// |-8.监听对话框显示 >>> 对话框显示时的操作
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    // 对话框显示时，初始化数据
    await initDetailData()
  }
})

/**
 * 监听表格数据变化
 */
watch(() => props.tableData, (newVal) => {
  if (newVal && dialogVisible.value) {
    initDetailData()
  }
}, {deep: true})

// 组件挂载时初始化
onMounted(() => {
  // 如果需要，可以预加载一些数据
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

.permission-container {
  padding: 8px 0;
}

.permission-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
}

.permission-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.permission-item:last-child {
  border-bottom: none;
}

.permission-item:hover {
  background-color: #f8f9fa;
}

.permission-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-name {
  font-weight: 500;
  color: #333;
}

.permission-tags {
  display: flex;
  gap: 6px;
}

.permission-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
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
