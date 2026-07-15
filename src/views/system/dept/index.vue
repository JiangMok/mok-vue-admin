<template>
  <div class="dept-manage">
    <div class="page-header">
      <h2>部门管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd"
                   v-if="userStore.hasPermission('system:dept:add')">
          <el-icon><Plus/></el-icon>
          新增部门
        </el-button>
        <el-button @click="handleExpandAll">{{ expandAll ? '折叠全部' : '展开全部' }}</el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <el-table
        :data="deptList"
        border
        stripe
        v-loading="loading"
        style="width: 100%"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="expandAll"
      >
        <el-table-column prop="deptName" label="部门名称" min-width="180" />
        <el-table-column prop="deptCode" label="部门编码" width="140" />
        <el-table-column prop="leader" label="负责人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" >
          <template #default="{ row }">
            {{ row.email || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleAddChild(row)"
                       v-if="userStore.hasPermission('system:dept:add')">
              新增子级
            </el-button>
            <el-button type="primary" size="small" @click="handleEdit(row)"
                       v-if="userStore.hasPermission('system:dept:edit')">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)"
                       v-if="userStore.hasPermission('system:dept:delete')">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <DeptDialog
      v-model:visible="dialogVisible"
      :is-edit="isEditMode"
      :edit-data="currentEditData"
      @success="handleDialogSuccess"
    />
    <DeptDetail
      v-model:visible="detailDialogVisible"
      :deptId="selectedDeptId"
      :dept-data="selectedDeptData"
      @edit="handleEditFromDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { deptApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { formatDateTime } from '@/utils/formatter'
import type { DeptItem } from '@/types'
import DeptDialog from './components/DeptDialog.vue'
import DeptDetail from './components/DeptDetail.vue'

const userStore = useUserStore()
const loading = ref(false)
const deptList = ref<DeptItem[]>([])
const expandAll = ref(true)

const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditData = ref<DeptItem | null>(null)

const detailDialogVisible = ref(false)
const selectedDeptId = ref('')
const selectedDeptData = ref<DeptItem | undefined>(undefined)

const fetchDeptTree = async () => {
  try {
    loading.value = true
    // 管理页用 scoped tree：管理员看全部，非管理员只看自己部门+子部门
    const res = await deptApi.getScopedTree()
    if (res.code === 200) {
      deptList.value = res.data || []
    } else {
      ElMessage.error(res.msg || '获取部门树失败')
    }
  } catch {
    ElMessage.error('获取部门树失败')
  } finally {
    loading.value = false
  }
}

const handleExpandAll = () => { expandAll.value = !expandAll.value }

const handleAdd = () => {
  isEditMode.value = false
  currentEditData.value = null
  dialogVisible.value = true
}

const handleAddChild = (row: DeptItem) => {
  isEditMode.value = false
  currentEditData.value = { parentId: row.id } as DeptItem
  dialogVisible.value = true
}

const handleEdit = (row: DeptItem) => {
  isEditMode.value = true
  currentEditData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row: DeptItem) => {
  try {
    await ElMessageBox.confirm(`确定删除部门 "${row.deptName}" 吗？`, '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    const res = await deptApi.delete(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchDeptTree()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleDetail = (row: DeptItem) => {
  selectedDeptId.value = row.id
  selectedDeptData.value = row
  detailDialogVisible.value = true
}

const handleEditFromDetail = (deptId: string) => {
  detailDialogVisible.value = false
  const dept = deptList.value.find(item => item.id === deptId)
  if (dept) handleEdit(dept)
}

const handleDialogSuccess = () => { fetchDeptTree() }

onMounted(() => { fetchDeptTree() })
</script>

<style scoped>
.dept-manage { padding: 20px; background: white; border-radius: 8px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; color: #333; }
.header-actions { display: flex; gap: 10px; }
.table-container { margin-bottom: 20px; }
</style>
