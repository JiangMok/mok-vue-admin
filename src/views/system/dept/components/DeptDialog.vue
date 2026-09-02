<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="550px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item label="部门名称" prop="deptName">
        <el-input v-model="formData.deptName" placeholder="请输入部门名称" clearable :maxlength="64" />
      </el-form-item>

      <el-form-item label="部门编码" prop="deptCode">
        <el-input v-model="formData.deptCode" placeholder="请输入部门编码" clearable :maxlength="64" />
      </el-form-item>

      <el-form-item label="上级部门" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="deptTree"
          :props="{ label: 'deptName', value: 'id', children: 'children' }"
          placeholder="请选择上级部门（空为根部门）"
          clearable
          check-strictly
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="负责人" prop="leader">
        <el-input v-model="formData.leader" placeholder="请输入负责人" clearable :maxlength="32" />
      </el-form-item>

      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入联系电话" clearable :maxlength="20" />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱" clearable :maxlength="64" />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" :rows="2" clearable :maxlength="200" />
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" :max="999" />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { deptApi } from '@/api'
import type { DeptItem } from '@/types'

interface Props {
  visible: boolean
  isEdit?: boolean
  editData?: DeptItem | null
}
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), { visible: false, isEdit: false, editData: null })
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const deptTree = ref<DeptItem[]>([])

const formData = reactive({
  deptName: '',
  deptCode: '',
  parentId: '0',
  leader: '',
  phone: '',
  email: '',
  description: '',
  sort: 0,
  status: 1
})

const dialogTitle = computed(() => props.isEdit ? '编辑部门' : '新增部门')
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const formRules: FormRules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  deptCode: [{ required: true, message: '请输入部门编码', trigger: 'blur' }],
  parentId: [{ required: true, message: '请选择上级部门', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const fetchDeptTree = async () => {
  try {
    const res = await deptApi.getScopedTree()
    if (res.code === 200) {
      deptTree.value = res.data || []
    }
  } catch {
    ElMessage.error('获取部门树失败')
  }
}

const initFormData = () => {
  if (props.isEdit && props.editData) {
    formData.deptName = props.editData.deptName || ''
    formData.deptCode = props.editData.deptCode || ''
    formData.parentId = props.editData.parentId || '0'
    formData.leader = props.editData.leader || ''
    formData.phone = props.editData.phone || ''
    formData.email = props.editData.email || ''
    formData.description = props.editData.description || ''
    formData.sort = props.editData.sort ?? 0
    formData.status = props.editData.status ?? 1
  } else {
    resetForm()
    formData.parentId = props.editData?.parentId ?? '0'
  }
}

const resetForm = () => {
  if (formRef.value) formRef.value.clearValidate()
  Object.assign(formData, {
    deptName: '', deptCode: '', parentId: '0',
    leader: '', phone: '', email: '', description: '',
    sort: 0, status: 1
  })
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitLoading.value = true

    const submitData = { ...formData }

    if (props.isEdit && props.editData) {
      const res = await deptApi.update({ id: props.editData.id, ...submitData })
      if (res.code === 200) ElMessage.success('部门更新成功')
      else ElMessage.error(res.msg || '更新失败')
    } else {
      const res = await deptApi.add(submitData)
      if (res.code === 200) ElMessage.success('部门添加成功')
      else ElMessage.error(res.msg || '添加失败')
    }

    emit('success')
    dialogVisible.value = false
    resetForm()
  } catch (error: any) {
    if (error?.fields) ElMessage.error('请正确填写表单信息')
    else ElMessage.error(error?.msg || '提交失败')
  } finally {
    submitLoading.value = false
  }
}

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    if (deptTree.value.length === 0) await fetchDeptTree()
    initFormData()
  }
})

onMounted(() => { fetchDeptTree() })
</script>
