<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="600px"
    :before-close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px" label-position="left">
      <el-form-item label="请求类型" prop="aiAnalysisRequestType">
        <el-input v-model="formData.aiAnalysisRequestType" placeholder="请输入请求类型代号（如 OPERATION_LOG）" clearable :maxlength="64" />
      </el-form-item>
      <el-form-item label="系统提示词" prop="systemPrompt">
        <el-input
          v-model="formData.systemPrompt"
          type="textarea"
          :rows="8"
          placeholder="请输入系统提示词"
          :maxlength="2000"
          show-word-limit
        />
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
import { aiSystemPromptConfigApi } from '@/api'
import type { AiSystemPromptConfig, AiSystemPromptConfigFormData } from '@/types'

interface Props {
  visible: boolean
  isEdit?: boolean
  editData?: AiSystemPromptConfig | null
}
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), { visible: false, isEdit: false, editData: null })
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const submitLoading = ref(false)

const formData = reactive<AiSystemPromptConfigFormData>({
  aiAnalysisRequestType: '',
  systemPrompt: ''
})

const dialogTitle = computed(() => props.isEdit ? '编辑提示词配置' : '新增提示词配置')
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const formRules: FormRules = {
  aiAnalysisRequestType: [{ required: true, message: '请输入请求类型', trigger: 'blur' }],
  systemPrompt: [{ required: true, message: '请输入系统提示词', trigger: 'blur' }]
}

const initFormData = () => {
  if (props.isEdit && props.editData) {
    formData.aiAnalysisRequestType = props.editData.aiAnalysisRequestType || ''
    formData.systemPrompt = props.editData.systemPrompt || ''
  } else {
    resetForm()
  }
}

const resetForm = () => {
  if (formRef.value) formRef.value.clearValidate()
  Object.assign(formData, { aiAnalysisRequestType: '', systemPrompt: '' })
}

const handleClose = () => { dialogVisible.value = false; resetForm() }

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (props.isEdit && props.editData) {
      const res = await aiSystemPromptConfigApi.update({ id: props.editData.id, ...formData })
      if (res.code === 200) ElMessage.success('更新成功')
      else ElMessage.error(res.msg || '更新失败')
    } else {
      const res = await aiSystemPromptConfigApi.create(formData)
      if (res.code === 200) ElMessage.success('添加成功')
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
