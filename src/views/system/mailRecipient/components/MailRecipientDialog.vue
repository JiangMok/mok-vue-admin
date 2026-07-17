<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="500px"
    :before-close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
      <el-form-item label="邮箱地址" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱地址" clearable :maxlength="128" />
      </el-form-item>
      <el-form-item label="收件人名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入收件人名称" clearable :maxlength="64" />
      </el-form-item>
      <el-form-item label="订阅类型" prop="mailTypes">
        <el-checkbox-group v-model="formData.mailTypes">
          <el-checkbox label="SYSTEM_CHECK">系统检查</el-checkbox>
          <el-checkbox label="ALERT">告警</el-checkbox>
          <el-checkbox label="NOTIFICATION">通知</el-checkbox>
        </el-checkbox-group>
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
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { mailRecipientApi } from '@/api'
import type { MailRecipient, MailRecipientFormData } from '@/types'

interface Props {
  visible: boolean
  isEdit?: boolean
  editData?: MailRecipient | null
}
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), { visible: false, isEdit: false, editData: null })
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const submitLoading = ref(false)

const formData = reactive<MailRecipientFormData>({
  email: '',
  name: '',
  status: 1,
  mailTypes: []
})

const dialogTitle = computed(() => props.isEdit ? '编辑收件人' : '新增收件人')
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const formRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入收件人名称', trigger: 'blur' }],
  mailTypes: [{ required: true, message: '至少选择一种订阅类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const initFormData = () => {
  if (props.isEdit && props.editData) {
    formData.email = props.editData.email || ''
    formData.name = props.editData.name || ''
    formData.status = props.editData.status ?? 1
    formData.mailTypes = props.editData.mailTypes || []
  } else {
    resetForm()
  }
}

const resetForm = () => {
  if (formRef.value) formRef.value.clearValidate()
  Object.assign(formData, { email: '', name: '', status: 1, mailTypes: [] })
}

const handleClose = () => { dialogVisible.value = false; resetForm() }

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitLoading.value = true
    const submitData: MailRecipientFormData = { ...formData }

    if (props.isEdit && props.editData) {
      const res = await mailRecipientApi.update({ id: props.editData.id, ...submitData })
      if (res.code === 200) ElMessage.success('收件人更新成功')
      else ElMessage.error(res.msg || '更新失败')
    } else {
      const res = await mailRecipientApi.create(submitData)
      if (res.code === 200) ElMessage.success('收件人添加成功')
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

watch(() => props.visible, (newVal) => { if (newVal) initFormData() })
</script>
