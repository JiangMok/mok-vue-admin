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
      <!-- 用户名 -->
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="formData.username"
          placeholder="请输入用户名"
          clearable
          :maxlength="20"
          show-word-limit
        />
      </el-form-item>

      <!-- 密码（新增用户时才显示） -->
      <el-form-item label="密码" prop="password" v-if="!isEdit">
        <el-input
          v-model="formData.password"
          type="password"
          placeholder="请输入密码"
          clearable
          show-password
          :maxlength="20"
        />
        <div class="form-tips">密码长度6-20位，必须包含大小写字母和数字</div>
      </el-form-item>

      <!-- 确认密码（新增用户时才显示） -->
      <el-form-item label="确认密码" prop="confirmPassword" v-if="!isEdit">
        <el-input
          v-model="formData.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          clearable
          show-password
          :maxlength="20"
        />
      </el-form-item>

      <!-- 昵称 -->
      <el-form-item label="昵称" prop="nickname">
        <el-input
          v-model="formData.nickname"
          placeholder="请输入昵称"
          clearable
          :maxlength="20"
          show-word-limit
        />
      </el-form-item>

      <!-- 手机号 -->
      <el-form-item label="手机号" prop="phone">
        <el-input
          v-model="formData.phone"
          placeholder="请输入手机号"
          clearable
          :maxlength="11"
        />
      </el-form-item>

      <!-- 邮箱 -->
      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="formData.email"
          placeholder="请输入邮箱"
          clearable
          :maxlength="50"
        />
      </el-form-item>

      <!-- 头像 -->
      <el-form-item label="头像" prop="avatar">
        <div class="avatar-upload">
          <el-upload
            class="avatar-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :headers="uploadHeaders"
            accept=".jpg,.jpeg,.png,.gif"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              class="avatar"
              @error="handleImageError"/>
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="avatar-tips">
            <p>建议尺寸：100×100px</p>
            <p>支持格式：JPG、PNG、GIF</p>
            <p>大小限制：2MB</p>
          </div>
        </div>
      </el-form-item>

      <!-- 状态 -->
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 角色（多选） -->
      <el-form-item label="角色" prop="roleIds">
        <el-select
          v-model="formData.roleIds"
          multiple
          filterable
          placeholder="请选择角色"
          style="width: 100%"
          :loading="roleLoading"
          :disabled="roleLoading"
        >
          <el-option
            v-for="role in roleList"
            :key="role.id"
            :label="role.roleName || role.name"
            :value="role.id"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 500;">{{ role.roleName || role.name }}</span>
              <div style="display: flex; gap: 8px;">
                <el-tag size="small" type="info">{{ role.roleCode || role.code }}</el-tag>
                <el-tag
                  size="small"
                  :type="role.status === 1 ? 'success' : 'danger'"
                >
                  {{ role.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </div>
            </div>
          </el-option>
        </el-select>

        <!-- 已选角色展示 -->
        <div class="selected-roles" v-if="formData.roleIds.length > 0">
          <div class="selected-title">已选择 {{ formData.roleIds.length }} 个角色：</div>
          <div class="selected-tags">
            <el-tag
              v-for="roleId in formData.roleIds"
              :key="roleId"
              closable
              @close="removeRole(roleId)"
              class="role-tag"
            >
              {{ getRoleName(roleId) }}
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
import type { RoleItem, UserFormData, UserRequestData } from '@/types'
import { roleApi, userApi } from '@/api'
import {useUserStore} from "@/stores/user.ts";
const userStore = useUserStore()
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
const formData = reactive<UserFormData>({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  phone: '',
  email: '',
  avatar: '',
  status: 1,
  roleIds: []
})

// 角色列表
const roleList = ref<RoleItem[]>([])
const roleLoading = ref(false)

// 提交加载状态
const submitLoading = ref(false)

// 头像上传相关
const avatarUrl = ref('')
const uploadUrl = ref(import.meta.env.VITE_API_BASE_URL+'/files/uploadAvatar')
const uploadHeaders = ref({})

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
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: '用户名只能包含字母、数字和下划线',
      trigger: 'blur'
    }
  ],
  password: [
    {
      required: !props.isEdit,
      message: '请输入密码',
      trigger: 'blur'
    },
    {
      min: 6,
      max: 20,
      message: '密码长度在 6 到 20 个字符',
      trigger: 'blur'
    },
    {
      // pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*]{6,20}$/,
      message: '密码必须包含大小写字母和数字',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    {
      required: !props.isEdit,
      message: '请确认密码',
      trigger: 'blur'
    },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (!props.isEdit && value !== formData.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号格式',
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    {
      type: 'email',
      message: '请输入正确的邮箱格式',
      trigger: 'blur'
    }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  roleIds: [
    {
      type: 'array',
      required: true,
      message: '请至少选择一个角色',
      trigger: 'change'
    }
  ]
}

// ================== 新增：初始化表单数据（编辑时）==================
const initFormData = async () => {
  if (props.isEdit && props.editData) {
    // console.log('编辑用户数据:', props.editData)

    // 填充表单数据
    formData.username = props.editData.username || ''
    formData.nickname = props.editData.nickname || ''
    formData.phone = props.editData.phone || ''
    formData.email = props.editData.email || ''
    formData.avatar = props.editData.avatar || ''
    formData.status = props.editData.status !== undefined ? props.editData.status : 1

    // 显示头像
    if (props.editData.avatar) {
      avatarUrl.value = props.editData.avatar
    }

    // ================== 新增：获取用户角色信息 ==================
    await fetchUserRoles(props.editData.id)

  } else {
    // 新增模式，重置表单
    resetForm()
  }
}

// ================== 新增：获取用户角色信息 ==================
const fetchUserRoles = async (userId: string) => {
  try {
    // console.log('正在获取用户角色，用户ID:', userId)

    // 调用获取用户角色的API
    const res = await roleApi.getUserRoles(userId)

    if (res.code === 200 && res.data) {
      // 将角色ID提取到 formData.roleIds
      const roleIds = res.data.map(role => role.id)
      // console.log('获取到的用户角色ID:', roleIds)

      formData.roleIds = roleIds
    } else {
      // console.warn('获取用户角色失败或没有角色:', res.msg)
      formData.roleIds = []
    }
  } catch (error) {
    // console.error('获取用户角色失败:', error)
    ElMessage.error('获取用户角色失败')
    formData.roleIds = []
  }
}
const handleImageError = () => {
  // console.warn('头像加载失败，可能文件已被删除');
  avatarUrl.value = '';           // 清空显示，回退到上传图标
  formData.avatar = '';           // 清空表单中的头像字段
  // 可选：提示用户原头像已丢失，请重新上传
  ElMessage.warning('原头像文件不存在，请重新上传');
};
// ================== 新增：重置表单 ==================
const resetForm = () => {
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  avatarUrl.value = ''
  Object.assign(formData, {
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    phone: '',
    email: '',
    avatar: '',
    status: 1,
    roleIds: []
  })
}

// ================== 新增：获取角色列表 ==================
const fetchRoleList = async () => {
  roleLoading.value = true
  try {
    const res = await roleApi.getAllRoles()
    // console.log('角色列表接口返回:', res)

    // 处理角色数据
    roleList.value = res.data || []

  } catch (error) {
    // console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    roleLoading.value = false
  }
}

// ================== 新增：根据角色ID获取角色名称 ==================
const getRoleName = (roleId: string) => {
  const role = roleList.value.find(item => item.id === roleId)
  return role ? (role.roleName || role.name || `角色ID: ${roleId}`) : `角色ID: ${roleId}`
}

// ================== 新增：移除角色 ==================
const removeRole = (roleId: string) => {
  const index = formData.roleIds.indexOf(roleId)
  if (index > -1) {
    formData.roleIds.splice(index, 1)
  }
}

// ================== 新增：头像上传处理 ==================
const handleAvatarSuccess = (response: any) => {
  // console.log('头像上传响应:', response)
  if (response.code === 200) {
    formData.avatar = response.data.fileUrl || ''
    avatarUrl.value = formData.avatar
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error(response.msg || '头像上传失败')
  }
}

const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }

  return true
}

// ================== 新增：关闭对话框 ==================
const handleClose = () => {
  if (formData.username || formData.nickname) {
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
    const submitData: UserRequestData = {
      nickname: formData.nickname,
      username: formData.username,
      phone: formData.phone,
      email: formData.email,
      avatar: formData.avatar,
      status: formData.status,
      roleIds: formData.roleIds
    }

    // 如果不是编辑模式，需要添加密码
    if (!props.isEdit) {
      submitData.password = formData.password
    }

    // console.log('提交数据:', JSON.stringify(submitData, null, 2))

    // 调用API
    if (props.isEdit && props.editData) {
      // 编辑用户
      await userApi.updateUser({ id: props.editData.id, ...submitData })
      userStore.setUserInfo({
        createTime: "",
        id: props.editData.id,
        updateTime: "",
        status: submitData.status,
        username: submitData.username,
        nickname: submitData.nickname,
        phone: submitData.phone,
        email: submitData.email,
        avatar: submitData.avatar
      })
      ElMessage.success('用户更新成功')
    } else {
      // 新增用户
      await userApi.addUser(submitData)
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
    if (roleList.value.length === 0) {
      await fetchRoleList()
    }
  }
})

// ================== 新增：组件挂载时初始化 ==================
onMounted(() => {
  // 设置上传请求头
  const token = localStorage.getItem('token')
  if (token) {
    uploadHeaders.value = {
      Authorization: `Bearer ${token}`
    }
  }

  // 提前加载角色列表，提升用户体验
  fetchRoleList()
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
