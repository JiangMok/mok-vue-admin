<template>
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
      <el-form-item label="权限名称" prop="permissionName">
        <el-input
          v-model="formData.permissionName"
          placeholder="请输入权限名称"
          clearable
          :maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="权限编码" prop="permissionCode">
        <el-input
          v-model="formData.permissionCode"
          placeholder="请输入权限编码"
          clearable
          :maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="权限描述" prop="description">
        <el-input
          v-model="formData.description"
          placeholder="请输入权限描述"
          clearable
          :maxlength="200"
          show-word-limit
          type="textarea"
          :rows="2"
        />
      </el-form-item>

      <el-form-item label="权限类型" prop="type">
        <el-select
          v-model="formData.type"
          placeholder="请选择权限类型"
          clearable
          style="width: 100%"
          @change="handleTypeChange"
        >
          <el-option label="目录" :value="1" />
<!--          <el-option label="菜单" :value="2" />-->
          <el-option label="按钮" :value="3" />
        </el-select>
      </el-form-item>

      <el-form-item label="父级权限" prop="parentId">
        <el-select
          v-model="formData.parentId"
          placeholder="请选择父级权限"
          clearable
          style="width: 100%"
          :loading="permissionLoading"
        >
          <el-option label="根目录" value="0" />
          <el-option
            v-for="permission in permissionList"
            :key="permission.id"
            :label="getPermissionDisplayName(permission)"
            :value="permission.id"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span>{{ getPermissionDisplayName(permission) }}</span>
              <div style="display: flex; gap: 8px;">
                <el-tag size="small" :type="getTypeTagType(permission.type)">
                  {{ getTypeText(permission.type) }}
                </el-tag>
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
      </el-form-item>

      <el-form-item v-if="showPathField" label="路由路径" prop="path">
        <el-input
          v-model="formData.path"
          placeholder="请输入路由路径"
          clearable
          :maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item v-if="showComponentField" label="组件路径" prop="component">
        <el-input
          v-model="formData.component"
          placeholder="请输入组件路径"
          clearable
          :maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="图标" prop="icon">
        <el-input
          v-model="formData.icon"
          placeholder="请输入图标名称或选择图标"
          clearable
          :maxlength="50"
          show-word-limit
        >
          <template #append>
            <el-button @click="showIconSelector = true">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        <div v-if="formData.icon" class="icon-preview">
          <el-icon :size="20">
            <component :is="formData.icon" />
          </el-icon>
          <span class="icon-name">{{ formData.icon }}</span>
        </div>
      </el-form-item>

      <el-form-item label="显示排序" prop="sort">
        <el-input-number
          v-model="formData.sort"
          :min="1"
          :max="999"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="显示状态" prop="visible">
        <el-radio-group v-model="formData.visible">
          <el-radio :value="1">显示</el-radio>
          <el-radio :value="0">隐藏</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="启用状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <!-- 图标选择器对话框 -->
    <el-dialog
      v-model="showIconSelector"
      title="选择图标"
      width="800px"
      append-to-body
    >
      <div class="icon-selector">
        <!-- TODO: 实现图标选择器，可以使用element-plus的图标库或其他图标库 -->
        <div class="icon-notice">
          <el-alert type="info" show-icon :closable="false">
            <template #title>
              请输入图标名称，参考 Element Plus 图标库
            </template>
          </el-alert>
        </div>
      </div>
      <template #footer>
        <el-button @click="showIconSelector = false">取消</el-button>
        <el-button type="primary" @click="showIconSelector = false">确定</el-button>
      </template>
    </el-dialog>

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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import type { PermissionFormData, PermissionItem } from '@/types'
import { permissionApi } from '@/api'

// 定义组件属性和事件
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

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据 - 根据接口请求数据调整
const formData = reactive<PermissionFormData>({
  // 新增时不需要id，编辑时需要
  id: '',
  permissionName: '',
  permissionCode: '',
  description: '',
  type: 1, // 默认目录类型
  parentId: '0', // 默认根目录
  icon: '',
  path: '',
  component: '',
  sort: 1,
  visible: 1,
  status: 1
})

// 权限列表数据（用于选择父级）
const permissionList = ref<PermissionItem[]>([])
const permissionLoading = ref(false)

// 图标选择器
const showIconSelector = ref(false)

// 提交加载状态
const submitLoading = ref(false)

// 计算属性
const dialogTitle = computed(() => {
  return props.isEdit ? '编辑权限' : '新增权限'
})

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 根据类型显示不同字段
const showPathField = computed(() => {
  // 目录和菜单有路由路径，按钮没有
  return formData.type === 1 || formData.type === 2
})

const showComponentField = computed(() => {
  // 只有菜单有组件路径
  return formData.type === 2
})

// 表单验证规则 - 根据接口数据调整
const formRules: FormRules = {
  permissionName: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  permissionCode: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择权限类型', trigger: 'change' }
  ],
  parentId: [
    {
      required: true,
      message: '请选择父级权限',
      trigger: 'change'
    }
  ],
  path: [
    // 根据类型动态验证
    {
      required: formData.type === 1 || formData.type === 2,
      message: '请输入路由路径',
      trigger: 'blur'
    },
    { max: 200, message: '长度不能超过200个字符', trigger: 'blur' }
  ],
  component: [
    // 根据类型动态验证
    {
      required: formData.type === 2,
      message: '请输入组件路径',
      trigger: 'blur'
    },
    { max: 200, message: '长度不能超过200个字符', trigger: 'blur' }
  ],
  icon: [
    { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入显示排序', trigger: 'blur' },
    { type: 'number', min: 1, max: 999, message: '排序值在1-999之间', trigger: 'blur' }
  ],
  visible: [
    { required: true, message: '请选择显示状态', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择启用状态', trigger: 'change' }
  ]
}

// 类型改变处理
const handleTypeChange = (value: number) => {
  // 根据接口数据，不同类型可能需要清空某些字段
  if (value === 3) {
    // 按钮类型：清空路由路径和组件路径（根据接口数据，按钮没有这些字段）
    formData.path = ''
    formData.component = ''
  } else if (value === 1) {
    // 目录类型：通常有路由路径，可能有组件路径（但根据常规设计，目录没有组件路径）
    formData.component = ''
  }
  // 菜单类型（2）：保持现有值
}

// 获取权限列表（用于选择父级）
const fetchPermissionList = async () => {
  permissionLoading.value = true
  try {
    // TODO: 可能需要调用不同的接口获取所有权限（非树形结构）
    // 假设这里调用的是获取所有权限列表的接口
    const res = await permissionApi.getByUserId()
    // console.log('所有权限列表:', res)

    // 根据实际接口响应结构调整
    // 假设返回的是 data.data 数组
    const allPermissions = res.data || []

    // 过滤掉当前正在编辑的权限（如果是编辑模式）
    if (props.isEdit && props.editData) {
      permissionList.value = allPermissions.filter(
        (permission: PermissionItem) => permission.id !== props.editData.id
      )
    } else {
      permissionList.value = allPermissions
    }

  } catch (error) {
    console.error('获取权限列表失败:', error)
    ElMessage.error('获取权限列表失败')
  } finally {
    permissionLoading.value = false
  }
}

// 获取权限显示名称
const getPermissionDisplayName = (permission: PermissionItem) => {
  const typeText = getTypeText(permission.type)
  return `[${typeText}] ${permission.permissionName} (${permission.permissionCode})`
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

// 初始化表单数据
const initFormData = async () => {
  if (props.isEdit && props.editData) {
    console.log('编辑权限数据:', props.editData)

    // 填充表单数据 - 确保所有字段都有值
    formData.id = props.editData.id || ''
    formData.permissionName = props.editData.permissionName || ''
    formData.permissionCode = props.editData.permissionCode || ''
    formData.description = props.editData.description || ''
    formData.type = props.editData.type || 1
    formData.parentId = props.editData.parentId || '0'
    formData.icon = props.editData.icon || ''
    formData.path = props.editData.path || ''
    formData.component = props.editData.component || ''
    formData.sort = props.editData.sort || 1
    formData.visible = props.editData.visible !== undefined ? props.editData.visible : 1
    formData.status = props.editData.status !== undefined ? props.editData.status : 1
  } else {
    // 新增模式，重置表单
    resetForm()
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  Object.assign(formData, {
    id: '',
    permissionName: '',
    permissionCode: '',
    description: '',
    type: 1,
    parentId: '0', // 默认根目录
    icon: '',
    path: '',
    component: '',
    sort: 1,
    visible: 1,
    status: 1
  })
}

// 关闭对话框
const handleClose = () => {
  if (formData.permissionName || formData.permissionCode) {
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

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()

    submitLoading.value = true

    // 准备提交数据 - 根据接口请求数据结构
    const submitData: any = {
      permissionName: formData.permissionName,
      permissionCode: formData.permissionCode,
      description: formData.description,
      type: formData.type,
      parentId: formData.parentId,
      icon: formData.icon,
      path: formData.path,
      component: formData.component,
      sort: formData.sort,
      visible: formData.visible,
      status: formData.status
    }

    // 编辑时需要添加id
    if (props.isEdit && props.editData) {
      submitData.id = props.editData.id
    }

    console.log('提交数据:', JSON.stringify(submitData, null, 2))

    // 调用API
    if (props.isEdit && props.editData) {
      // 编辑权限 - 根据接口，需要传入id
      await permissionApi.update(submitData)
      ElMessage.success('权限更新成功')
    } else {
      // 新增权限 - 不需要id
      await permissionApi.add(submitData)
      ElMessage.success('权限添加成功')
    }

    // 触发成功事件
    emit('success')

    // 关闭对话框
    dialogVisible.value = false
    resetForm()

  } catch (error: any) {
    console.error('表单提交错误:', error)
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

// 监听对话框显示
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    // 对话框显示时，初始化数据
    await initFormData()

    // 获取权限列表
    await fetchPermissionList()
  }
})

// 监听类型变化，动态调整验证规则
watch(() => formData.type, (newType) => {
  // 更新验证规则
  if (formRef.value) {
    formRef.value.clearValidate()
  }
})

// 组件挂载时初始化
onMounted(() => {
  // 预加载权限列表
  fetchPermissionList()
})
</script>

<style scoped>
.el-form-item {
  margin-bottom: 20px;
}

.icon-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.icon-name {
  font-size: 12px;
  color: #666;
}

.icon-selector {
  min-height: 300px;
}

.icon-notice {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 表单字段提示 */
.field-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
