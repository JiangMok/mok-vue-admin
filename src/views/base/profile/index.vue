<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <!-- 页面标题 -->
      <template #header>
        <div class="card-header">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </div>
      </template>

      <!-- 用户信息展示 -->
      <div class="user-info">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <el-avatar :size="100" :src="userInfo.avatar" class="user-avatar">
            {{ userInfo.nickname?.charAt(0) || userInfo.username?.charAt(0) || 'U' }}
          </el-avatar>
          <div class="avatar-upload">
            <el-upload
              :action="uploadUrl"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :on-change="handleAvatarChange"
              accept="image/*"
            >
<!--              <el-button type="primary" size="small" :icon="Camera">更换头像</el-button>-->
            </el-upload>
          </div>
        </div>

        <!-- 用户信息表单 -->
        <el-form
          ref="formRef"
          :model="userInfo"
          :rules="rules"
          label-width="100px"
          class="info-form"
        >
<!--          <el-form-item label="用户ID" prop="id">-->
<!--            <el-input v-model="userInfo.id" disabled />-->
<!--          </el-form-item>-->

          <el-form-item label="用户名" prop="username">
            <el-input v-model="userInfo.username" disabled />
          </el-form-item>

          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="userInfo.nickname" placeholder="请输入昵称" disabled/>
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="userInfo.phone" placeholder="请输入手机号" disabled/>
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="userInfo.email" placeholder="请输入邮箱" disabled/>
          </el-form-item>

          <el-form-item label="状态" prop="status">
            <el-tag :type="userInfo.status === 1 ? 'success' : 'danger'">
              {{ userInfo.status === 1 ? '正常' : '禁用' }}
            </el-tag>
            <span class="status-tip">
              {{ userInfo.status === 1 ? '账户正常使用中' : '账户已被禁用' }}
            </span>
          </el-form-item>

          <el-form-item label="创建时间" prop="createTime">
            <el-input :value="formatDate(userInfo.createTime)" disabled />
          </el-form-item>

          <el-form-item label="更新时间" prop="updateTime">
            <el-input :value="formatDate(userInfo.updateTime)" disabled />
          </el-form-item>

          <el-form-item>
<!--            <el-button type="primary" @click="saveUserInfo" :loading="saving">-->
<!--              保存修改-->
<!--            </el-button>-->
<!--            <el-button @click="resetForm">重置</el-button>-->
            <el-button type="warning" @click="showPasswordDialog">修改密码</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="500px"
    >
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
<!--        <el-form-item label="原密码" prop="oldPassword">-->
<!--          <el-input-->
<!--            v-model="passwordForm.oldPassword"-->
<!--            type="password"-->
<!--            placeholder="请输入原密码"-->
<!--            show-password-->
<!--          />-->
<!--        </el-form-item>-->
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
          <div class="password-tips">
            密码需包含字母和数字，长度8-20位
          </div>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPasswordChange" :loading="changingPassword">
            确认修改
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, type FormInstance, type UploadFile } from 'element-plus'
import { User, Camera } from '@element-plus/icons-vue'
import type { UploadProps } from 'element-plus'
import {userApi} from "@/api";
import type {UserRequestData} from "@/types";

const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const uploadUrl = ref(import.meta.env.VITE_API_BASE_URL+'/files/uploadAvatar')
const userStore = useUserStore()
// 状态变量
const loading = ref(false)
// 用户信息（根据UserInfo接口定义）
const userInfo = reactive({
  id: '',
  username: '',
  nickname: '',
  phone: '',
  email: '',
  avatar: null as string | null,
  status: 1,
  createTime: '',
  updateTime: ''
})

// 表单验证规则
const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在2到20个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

// 密码修改相关
const passwordDialogVisible = ref(false)
const passwordForm = reactive({
  // oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  // oldPassword: [
  //   { required: true, message: '请输入原密码', trigger: 'blur' }
  // ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/, message: '密码需包含字母和数字，长度8-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const saving = ref(false)
const changingPassword = ref(false)

// 初始化用户信息
const initUserInfo = async () => {
  const userStore = useUserStore();
  try {
    loading.value = true
    const res = await userApi.getUserById(userStore.userId)
    if (res.code === 200) {
      // 只复制UserInfo接口定义的字段
      userInfo.id = res.data.user.id || ''
      userInfo.username = res.data.user.username || ''
      userInfo.nickname = res.data.user.nickname || ''
      userInfo.phone = res.data.user.phone || ''
      userInfo.email = res.data.user.email || ''
      userInfo.avatar = res.data.user.avatar || null
      userInfo.status = res.data.user.status || 1
      userInfo.createTime = res.data.user.createTime || ''
      userInfo.updateTime = res.data.user.updateTime || ''
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

// 头像上传
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isJPGorPNG = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png'
  const isLt2M = rawFile.size / 1024 / 1024 < 2

  if (!isJPGorPNG) {
    ElMessage.error('头像图片只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleAvatarChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      userInfo.avatar = e.target?.result as string
      ElMessage.success('头像上传成功')
    }
    reader.readAsDataURL(file)
  }
}

// 保存用户信息
const saveUserInfo = () => {
  if (!formRef.value) return

  formRef.value.validate((valid) => {
    if (valid) {
      saving.value = true

      // 模拟API调用
      setTimeout(() => {
        // 更新用户store
        userStore.setUserInfo({
          createTime: userInfo.updateTime,
          id: userInfo.id,
          status: userInfo.status,
          updateTime: userInfo.updateTime,
          username: userInfo.username,
          nickname: userInfo.nickname,
          phone: userInfo.phone,
          email: userInfo.email,
          avatar: userInfo.avatar
        })

        saving.value = false
        ElMessage.success('个人信息保存成功')
      }, 1000)
    }
  })
}

// 重置表单
const resetForm = () => {
  initUserInfo()
}

// 显示修改密码对话框
const showPasswordDialog = () => {
  passwordDialogVisible.value = true
}

// 提交密码修改
const submitPasswordChange = () => {
  if (!passwordFormRef.value) return

  passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      changingPassword.value = true
      // 准备提交数据
      const submitData: UserRequestData = {
        avatar: "", email: "", phone: "", roleIds: [], status: 0,
        id: userInfo.id,
        username: userInfo.username,
        nickname: userInfo.nickname,
        password: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      }
      try{
        const res = await userApi.updateUserPwd(submitData)
        if(res.code === 200 && res.data){
          changingPassword.value = false
          passwordDialogVisible.value = false

          // 重置表单
          // passwordForm.oldPassword = ''
          passwordForm.newPassword = ''
          passwordForm.confirmPassword = ''

          ElMessage.success(res.msg)
        }else{
          ElMessage.success(res.msg)
        }
      }catch (error){
        ElMessage.success(error as string)
      }finally{
        changingPassword.value = false
      }


    }
  })
}

// 生命周期
onMounted(() => {
  initUserInfo()
})
/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.log("日期格式化失败:", error)
    return dateString
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 140px);
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.card-header .el-icon {
  font-size: 20px;
}

.user-info {
  display: flex;
  gap: 40px;
  padding: 20px 0;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  border: 3px solid #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.info-form {
  flex: 1;
  max-width: 500px;
}

.status-tip {
  margin-left: 10px;
  color: #666;
  font-size: 14px;
}

.password-tips {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-info {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .info-form {
    width: 100%;
  }
}
</style>
