<template>
  <!-- 用户添加/编辑表单对话框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item label="角色名称" prop="roleName">
        <el-input
          v-model="formData.roleName"
          placeholder="请输入角色名称"
          clearable
          :maxlength="20"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="角色编码" prop="roleCode">
        <el-input
          v-model="formData.roleCode"
          placeholder="请输角色编码"
          clearable
          :maxlength="20"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="角色描述" prop="description">
        <el-input
          v-model="formData.description"
          placeholder="请输角色描述"
          clearable
          :maxlength="20"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="角色排序" prop="sort">
        <el-input
          v-model="formData.sort"
          placeholder="请输角色描述"
          clearable
          :maxlength="20"
          show-word-limit
        />
      </el-form-item>
      <!-- 状态 -->
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 权限（多选） -->
      <el-form-item label="权限" prop="permissionIds">
        <el-select
          v-model="formData.permissionIds"
          multiple
          filterable
          placeholder="请选择权限"
          style="width: 100%"
          :loading="permissionLoading"
          :disabled="permissionLoading"
        >
          <el-option
            v-for="permission in permissionList"
            :key="permission.id"
            :label="permission.permissionName"
            :value="permission.id"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 500;">{{ permission.permissionName}}</span>
              <div style="display: flex; gap: 8px;">
                <el-tag size="small" type="info">{{ permission.permissionCode}}</el-tag>
                <el-tag
                  size="small"
                  :type="permission.status === 1 ? 'success' : 'danger'"
                >
                  {{ permission.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </div>
            </div>
          </el-option>
        </el-select>

        <!-- 已选权限展示 -->
        <div class="selected-roles" v-if="formData.permissionIds.length > 0">
          <div class="selected-title">已选择 {{ formData.permissionIds.length }} 个权限：</div>
          <div class="selected-tags">
            <el-tag
              v-for="permissionId in formData.permissionIds"
              :key="permissionId"
              closable
              @close="removePermission(permissionId)"
              class="role-tag"
            >
<!--              {{ getPermissionName(permissionId) }}-->
              {{ getPermissionName(permissionId) }}
            </el-tag>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// ================== 新增：导入需要的库和类型 ==================
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type {ApiPermission, RoleFormData, RoleItem, UserFormData, UserRequestData} from '@/types'
import {permissionApi, roleApi, userApi} from '@/api'

// ================== 新增：定义组件属性和事件 ==================
interface Props {
  visible: boolean
  isEdit?: boolean
  editData?: any
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  isEdit: false,
  editData: null
})

const emit = defineEmits<Emits>()

// ================== 新增：表单引用和数据 ==================
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<RoleFormData>({
  createBy: '',
  roleName: '',
  roleCode: '',
  description: '',
  sort: 1,
  status: 1,
  permissionIds: []
})

// 角色列表
const permissionList = ref<ApiPermission[]>([])
const permissionLoading = ref(false)
// 提交加载状态
const submitLoading = ref(false)

// ================== 新增：计算属性 ==================
// 计算对话框标题
const dialogTitle = computed(() => {
  return props.isEdit ? '编辑用户' : '新增用户'
})

// 计算对话框是否可见
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// ================== 新增：表单验证规则 ==================
const formRules: FormRules = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  // sort: [
  //   { required: true, message: '请输入角色排序', trigger: 'blur' },
  //   { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  // ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  permissionIds: [
    {
      type: 'array',
      required: true,
      message: '请至少选择一个权限',
      trigger: 'change'
    }
  ]
}

// ================== 新增：初始化表单数据（编辑时）==================
const initFormData = async () => {
  if (props.isEdit && props.editData) {
    // console.log('编辑用户数据:', props.editData)
    // 填充表单数据
    formData.roleName = props.editData.roleName || ''
    formData.roleCode = props.editData.roleCode || ''
    formData.description = props.editData.description || ''
    formData.sort = props.editData.sort || ''
    formData.status = props.editData.status !== undefined ? props.editData.status : 1
    permissionLoading.value = true
    // 先获取所有权限列表
    await fetchPermissionList()
    // 然后获取角色已有权限并回显
    await fetchRolePermission(props.editData.id)
    permissionLoading.value = false
  } else {
    // 新增模式，重置表单
    resetForm()
    permissionLoading.value = true
    await fetchPermissionList()
    permissionLoading.value = false
  }
}

// ================== 新增：获取角色权限信息 ==================
const fetchRolePermission = async (roleId: string) => {
  try {
    const res = await permissionApi.getByRoleId(roleId)
    if (res.code === 200 && res.data) {

      const permissionIds = res.data.map(permission => permission.id)
      // console.log('角色已有权限ID:', permissionIds)
      formData.permissionIds = permissionIds
    } else {
      // console.warn('获取角色权限失败:', res.msg)
      formData.permissionIds = []
    }
  } catch (error) {
    // console.error('获取角色权限失败:', error)
    ElMessage.error('获取角色权限失败')
    formData.permissionIds = []
  }
}

// ================== 新增：重置表单 ==================
const resetForm = () => {
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  Object.assign(formData, {
    roleName: '',
    roleCode: '',
    description: '',
    sort: 1,
    status: 1,
    permissionIds: []
  })
}

// ================== 新增：获取权限列表 ==================
const fetchPermissionList = async () => {
  permissionLoading.value = true
  try {
    const res = await permissionApi.getByUserId()
    // console.log('所有权限列表:', res)
    permissionList.value = res.data || []
  } catch (error) {
    // console.error('获取权限列表失败:', error)
    ElMessage.error('获取权限列表失败')
  } finally {
    permissionLoading.value = false
  }
}

// ================== 新增：根据权限ID获取权限名称 ==================
const getPermissionName = (permissionId: string) => {
  const permission = permissionList.value.find(item => item.id === permissionId)
  return permission ? (permission.permissionName  || `权限ID: ${permissionId}`) : `权限ID: ${permissionId}`
}

// ================== 新增：移除 ==================
const removePermission = (permissionId: string) => {
  const index = formData.permissionIds.indexOf(permissionId)
  if (index > -1) {
    formData.permissionIds.splice(index, 1)
  }
}

// ================== 新增：关闭对话框 ==================
const handleClose = () => {
  if (formData.roleName) {
    ElMessageBox.confirm('确认关闭？已填写的内容将不会被保存', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      dialogVisible.value = false
      resetForm()
    }).catch(() => {
      // 取消关闭
    })
  } else {
    dialogVisible.value = false
    resetForm()
  }
}

// ================== 新增：提交表单 ==================
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()

    submitLoading.value = true

    // 准备提交数据
    const submitData: RoleFormData = {
      roleName: formData.roleName,
      roleCode: formData.roleCode,
      description: formData.description,
      sort: formData.sort,
      status: formData.status,
      permissionIds: formData.permissionIds,
      createBy:formData.createBy
    }

    // console.log('提交数据:', JSON.stringify(submitData, null, 2))

    // 调用API
    if (props.isEdit && props.editData) {
      // 编辑用户
      await roleApi.updateRole({ id: props.editData.id, ...submitData })
      ElMessage.success('用户更新成功')
    } else {
      // 新增用户
      await roleApi.addRole(submitData)
      ElMessage.success('用户添加成功')
    }

    // 触发成功事件
    emit('success')

    // 关闭对话框
    dialogVisible.value = false
    resetForm()

  } catch (error: any) {
    // console.error('表单提交错误:', error)
    if (error.fields) {
      // 表单验证失败
      ElMessage.error('请正确填写表单信息')
    } else {
      // API调用失败
      ElMessage.error(error.msg || error.message || '提交失败，请重试')
    }
  } finally {
    submitLoading.value = false
  }
}

// ================== 新增：监听对话框显示 ==================
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    // 对话框显示时，初始化数据
    await initFormData()

    // 如果没有所有角色数据，获取角色列表
    if (permissionList.value.length === 0) {
      await fetchPermissionList()
    }
  }
})

// ================== 新增：组件挂载时初始化 ==================
onMounted(() => {
  // 提前加载角色列表，提升用户体验
  fetchPermissionList()
})
</script>

<style scoped>
/* ================== 新增：对话框表单样式 ================== */
.el-form-item {
  margin-bottom: 20px;
}

.form-tips {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  line-height: 1.4;
}

.avatar-upload {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.avatar-tips {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.avatar-tips p {
  margin: 0 0 5px 0;
}

.selected-roles {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.selected-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.role-tag {
  transition: all 0.3s;
}

.role-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
