<template>
  <div class="mail-sender-config">
    <div class="page-header">
      <h2>发件箱配置</h2>
      <span class="page-tip">系统仅维护一个邮箱，更新后热刷新无需重启</span>
    </div>

    <div class="form-container" v-loading="loading">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="left"
        style="max-width: 600px"
      >
        <el-form-item label="SMTP 服务器" prop="host">
          <el-input v-model="formData.host" placeholder="如 smtp.163.com" clearable />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number v-model="formData.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="SSL 加密" prop="sslEnable">
          <el-radio-group v-model="formData.sslEnable">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="发件人地址" prop="fromAddress">
          <el-input v-model="formData.fromAddress" placeholder="如 mokservice@163.com" clearable />
        </el-form-item>
        <el-form-item label="认证用户名" prop="username">
          <el-input v-model="formData.username" placeholder="SMTP 认证用户名" clearable />
        </el-form-item>
        <el-form-item label="认证密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            :placeholder="formData.id ? '留空则不修改' : '首次配置必须填写'"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存配置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormItemRule, type FormRules } from 'element-plus'
import { mailSenderApi } from '@/api'
import type { MailSenderFormData } from '@/types'

const formRef = ref<FormInstance>()
const loading = ref(false)
const submitLoading = ref(false)

const formData = reactive<MailSenderFormData>({
  host: '',
  port: 465,
  sslEnable: 1,
  fromAddress: '',
  username: '',
  password: '',
  status: 1
})

const passwordRule: FormItemRule = {
  validator: (_rule, value, callback) => {
    if (!formData.id && !value) callback(new Error('首次配置必须填写认证密码'))
    else callback()
  },
  trigger: 'blur'
}

const formRules: FormRules = {
  host: [{ required: true, message: '请输入 SMTP 服务器地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  fromAddress: [{ required: true, message: '请输入发件人地址', trigger: 'blur' }],
  username: [{ required: true, message: '请输入认证用户名', trigger: 'blur' }],
  password: [passwordRule],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const fetchConfig = async () => {
  try {
    loading.value = true
    const res = await mailSenderApi.getConfig()
    if (res.code === 200 && res.data) {
      formData.id = res.data.id
      formData.host = res.data.host
      formData.port = res.data.port
      formData.sslEnable = res.data.sslEnable
      formData.fromAddress = res.data.fromAddress
      formData.username = res.data.username
      formData.password = ''
      formData.status = res.data.status
    }
  } catch {
    // 未配置时不提示错误
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitLoading.value = true
    const submitData: MailSenderFormData = { ...formData }
    if (formData.id && !submitData.password) delete submitData.password
    const res = await mailSenderApi.updateConfig(submitData)
    if (res.code === 200) {
      ElMessage.success('发件箱配置保存成功（事务提交后已热刷新）')
      await fetchConfig()
    } else ElMessage.error(res.msg || '保存失败')
  } catch (error: any) {
    if (error?.fields) ElMessage.error('请正确填写表单信息')
    else ElMessage.error(error?.msg || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => { fetchConfig() })
</script>

<style scoped>
.mail-sender-config { padding: 20px; background: white; border-radius: 8px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h2 { margin: 0; color: #333; }
.page-tip { color: #999; font-size: 13px; }
.form-container { padding-top: 10px; }
</style>
