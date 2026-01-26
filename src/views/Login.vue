<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>MOK-后台基础系统</h2>
        <p>欢迎登录，请填写登录信息</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item prop="captcha">
          <div class="captcha-container">
            <el-input
              v-model="loginForm.captcha"
              placeholder="请输入验证码"
              :prefix-icon="Picture"
              size="large"
              style="flex: 1"
            />
            <div class="captcha-img" @click="refreshCaptcha">
              <img :src="captchaImage" v-if="captchaImage" alt="验证码"/>
              <div v-else class="captcha-loading">加载中...</div>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-checkbox v-model="rememberMe">记住我</el-checkbox>
        <el-link type="primary" underline="hover">忘记密码？</el-link>
      </div>
    </div>

    <div class="copyright">
      © 2024 后台管理系统
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {Lock, Picture, User} from '@element-plus/icons-vue'
import {useUserStore} from '@/stores/user'
import {ElMessage, type FormInstance, type FormRules} from "element-plus";
import {authApi, captchaApi} from "@/api";
//=================基础对象创建   &   表单字段赋值=================================
//登陆表单数据(需要给默认值),并且声明为响应式数据
const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  captchaKey: ''
})
//表单引用
const loginFormRef = ref<FormInstance>()
//获取路由实例
const router = useRouter()
//获取一同胡store
const userStore = useUserStore()
// 验证码图片
const captchaImage = ref('')
// 加载状态
const loading = ref(false)
// 记住我
const rememberMe = ref(false)
//=================表单校验===================================================
const loginRules: FormRules = {
  username: [
    //required:必填,trigger:触犯验证的时机:blur:失去焦点时验证
    {required: true, message: '请输入用户名', trigger: 'blur'},
    {min: 3, message: '用户名至少3个字符', trigger: 'blur'}
  ],
  password: [
    {required: true, message: '请输入密码', trigger: 'blur'},
    {min: 6, message: '密码至少6个字符', trigger: 'blur'}
  ],
  captcha: [
    {required: true, message: '请输入验证码', trigger: 'blur'},
    // {pattern: /^\d+$/, message: '验证码必须为数字', trigger: 'blur'}
  ]
}

//=================该页面要用到的各种函数============================================
/**
 * 获取验证码
 */
const refreshCaptcha = async () => {
  try {
    const res = await captchaApi.getCaptcha();
    console.log('验证码接口返回:', res);
    captchaImage.value = res.data.image
    loginForm.captchaKey = res.data.key
  } catch (e) {
    console.error('验证码获取失败', e)
    ElMessage.error('验证码获取失败')
  }
}
/**
 * 登录
 */
const handleLogin = async () => {
  //验证表单是否存在
  if (!loginFormRef.value) {
    return
  }
  try {
    //执行表单验证,如果失败会抛出异常
    await loginFormRef.value.validate()
  } catch (e) {
    console.log('表单验证失败', e)
    return
  }
  //设置等待效果
  loading.value = true
  try {
    console.log("开始登录,参数:", loginForm)
    //调用登录api
    const res = await authApi.login(loginForm)
    //控制台输出登录响应
    console.log('登录响应:', res)
    //检查是否登录成功
    if (res.code === 200 && res.success && !res.error) {
      //登陆成功,调用store的afterLogin方法
      //作用 : 保存token,用户信息
      await userStore.afterLogin(res.data)
      // 显示成功消息
      ElMessage.success('登录成功')
      // 刷新验证码，防止暴力破解
      // 跳转到首页（路由守卫会处理动态路由）
      // ========== 修改开始 ==========
      // 保持原来的代码，但添加重试
      const retryLogin = async (retryCount = 0) => {
        try {
          await router.push('/dashboard')
        } catch (error) {
          console.log(`第${retryCount + 1}次跳转失败`)
          if (retryCount < 3) {
            // 等待一段时间后重试
            setTimeout(() => retryLogin(retryCount + 1), 500)
          } else {
            // 最终尝试跳转到仪表盘
            router.push('/dashboard')
          }
        }
      }

      // 开始跳转
      retryLogin()
    } else {
      // 登录失败，显示错误信息
      ElMessage.error("try.else:"+res.msg || '登录失败')

      // 刷新验证码，防止暴力破解
      refreshCaptcha()
    }
  } catch (e: any) {
    // 捕获登录过程中的所有错误
    console.error('登录错误:', e)
    // 显示错误信息
    let errorMsg = '登录失败'
    if (e.message?.includes('Network Error')) {
      errorMsg = '网络错误，请检查后端服务'
    } else if (e.msg) {
      errorMsg = e.msg
    }
    ElMessage.error("catch:"+errorMsg)
    // 刷新验证码
    refreshCaptcha()
    // 清空验证码输入框
    loginForm.captcha = ''
  } finally {
    // 无论成功或失败，都关闭加载状态
    loading.value = false
  }
}
//=================页面加载时的操作(生命周期钩子)============================================
onMounted(() => {
  refreshCaptcha();
  //如果有记住的用户名,自动填充
  const savedUsername = localStorage.getItem('remember_username')
  if (savedUsername) {
    loginForm.username = savedUsername
    rememberMe.value = true
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.login-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-img {
  width: 120px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.captcha-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-loading {
  color: #999;
  font-size: 12px;
}

.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.copyright {
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}
</style>
