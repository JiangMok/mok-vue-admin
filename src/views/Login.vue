<template>
  <div class="login-container">
    <!-- 左侧品牌面板 -->
    <div class="login-brand">
      <div class="brand-inner">
        <div class="brand-logo"></div>
        <h1 class="brand-name">MOK</h1>
        <p class="brand-subtitle">后台管理系统</p>
        <p class="brand-tagline">精准监控 · 高效运维</p>
        <div class="brand-accent">
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <!-- 右侧表单区域 -->
    <div class="login-main">
      <div class="login-box">
        <div class="login-header">
          <h2>欢迎回来</h2>
          <p>请登录您的账户</p>
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
              placeholder="用户名"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item prop="captcha">
            <div class="captcha-container">
              <el-input
                v-model="loginForm.captcha"
                placeholder="验证码"
                :prefix-icon="Picture"
                size="large"
                style="flex: 1"
              />
              <div class="captcha-img" @click="refreshCaptcha">
                <img :src="captchaImage" v-if="captchaImage" alt="验证码"/>
                <div v-else class="captcha-loading">点击获取</div>
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
              登 录
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="copyright">
        © 2025 MOK 后台管理系统
      </div>
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

const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  captchaKey: ''
})
const loginFormRef = ref<FormInstance>()
const router = useRouter()
const userStore = useUserStore()
const captchaImage = ref('')
const loading = ref(false)
const rememberMe = ref(false)

const loginRules: FormRules = {
  username: [
    {required: true, message: '请输入用户名', trigger: 'blur'},
    {min: 3, message: '用户名至少3个字符', trigger: 'blur'}
  ],
  password: [
    {required: true, message: '请输入密码', trigger: 'blur'},
    {min: 6, message: '密码至少6个字符', trigger: 'blur'}
  ],
  captcha: [
    {required: true, message: '请输入验证码', trigger: 'blur'},
  ]
}

const refreshCaptcha = async () => {
  try {
    const res = await captchaApi.getCaptcha();
    if(res.code != 200 ){
      ElMessage.error('验证码获取失败:'+res.msg)
      return
    }
    captchaImage.value = res.data.image
    loginForm.captchaKey = res.data.key
  } catch (e) {
    // ignore
  }
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
  } catch (e) {
    console.log('表单验证失败', e)
    return
  }
  loading.value = true
  try {
    const res = await authApi.login(loginForm)
    if (res.code === 200 && res.success && !res.error) {
      await userStore.afterLogin(res.data)
      ElMessage.success('登录成功')
      const retryLogin = async (retryCount = 0) => {
        try {
          await router.push('/dashboard')
        } catch (error) {
          console.log(`第${retryCount + 1}次跳转失败`)
          if (retryCount < 3) {
            setTimeout(() => retryLogin(retryCount + 1), 500)
          } else {
            router.push('/dashboard')
          }
        }
      }
      retryLogin()
    } else {
      ElMessage.error(res.msg || '登录失败')
      refreshCaptcha()
    }
  } catch (e: any) {
    refreshCaptcha()
    loginForm.captcha = ''
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshCaptcha();
  const savedUsername = localStorage.getItem('remember_username')
  if (savedUsername) {
    loginForm.username = savedUsername
    rememberMe.value = true
  }
})
</script>

<style scoped>
/* ===================================================================
   Login — 左右分栏布局
   左: 深色品牌面板 (#1e293b) + 六边形 Logo + 品牌信息
   右: 浅色表单区 + 居中卡片
   记忆点: 左侧暗色面板的几何品牌标识
   =================================================================== */

.login-container {
  display: flex;
  min-height: 100vh;
  overflow: hidden;
}

/* ========================= 左侧品牌面板 ========================= */
.login-brand {
  flex: 0 0 44%;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 暗色面板上的微弱点阵纹理 */
.login-brand::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
}

/* 右下角大号装饰几何 */
.login-brand::after {
  content: '';
  position: absolute;
  right: -60px;
  bottom: -80px;
  width: 360px;
  height: 360px;
  border: 2px solid rgba(91, 127, 188, 0.12);
  border-radius: 50%;
  pointer-events: none;
}

.brand-inner {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
}

/* 六边形 Logo — 左侧主视觉 */
.brand-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 28px;
  background: linear-gradient(135deg, #5b7fbc 0%, #3b5998 100%);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  box-shadow: 0 0 40px rgba(91, 127, 188, 0.3);
}

.brand-name {
  margin: 0;
  font-size: 48px;
  font-weight: 300;
  color: #e2e8f0;
  letter-spacing: 6px;
}

.brand-subtitle {
  margin: 8px 0 0 0;
  font-size: 16px;
  font-weight: 400;
  color: #94a3b8;
  letter-spacing: 2px;
}

.brand-tagline {
  margin: 28px 0 0 0;
  font-size: 13px;
  color: #64748b;
  letter-spacing: 1px;
}

/* 装饰线 */
.brand-accent {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
}

.brand-accent span {
  display: block;
  height: 2px;
  border-radius: 2px;
}

.brand-accent span:first-child {
  width: 40px;
  background: #5b7fbc;
}

.brand-accent span:last-child {
  width: 16px;
  background: #3b5998;
}

/* ========================= 右侧表单区域 ========================= */
.login-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--app-bg);
  padding: 40px;
}

/* ---- 登录卡片 ---- */
.login-box {
  width: 380px;
  padding: 40px 36px 32px;
  background: var(--app-bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--app-border);
}

/* ---- 头部 ---- */
.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  margin: 0 0 8px 0;
  color: var(--app-text);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.login-header p {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 14px;
}

.login-header p::after {
  content: '';
  display: block;
  width: 32px;
  height: 3px;
  background: var(--app-accent);
  border-radius: 3px;
  margin: 12px auto 0;
}

/* ---- 表单项 ---- */
.el-form-item {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  background: var(--app-bg-elevated);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border-radius: var(--radius);
  padding: 2px 14px;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

:deep(.el-input__wrapper:hover) {
  background: var(--app-bg-surface);
  border-color: var(--app-border);
}

:deep(.el-input__wrapper.is-focus) {
  background: var(--app-bg-surface);
  box-shadow: 0 0 0 3px rgba(59, 89, 152, 0.1);
  border-color: var(--app-accent);
}

:deep(.el-input__inner) {
  height: 44px;
  font-size: 15px;
  color: var(--app-text);
}

:deep(.el-input__inner::placeholder) {
  color: var(--app-text-muted);
}

:deep(.el-input__prefix-inner) {
  color: var(--app-text-muted);
  font-size: 18px;
  margin-right: 8px;
}

:deep(.el-input__wrapper.is-focus .el-input__prefix-inner) {
  color: var(--app-accent);
}

/* ---- 验证码 ---- */
.captcha-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.captcha-img {
  width: 115px;
  min-width: 115px;
  height: 44px;
  border-radius: var(--radius);
  cursor: pointer;
  overflow: hidden;
  border: 1px solid var(--app-border);
  transition: all var(--transition-fast);
  background: var(--app-bg-elevated);
}

.captcha-img:hover {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px rgba(59, 89, 152, 0.06);
}

.captcha-img img {
  width: 100%;
  height: 100%;
  display: block;
}

.captcha-loading {
  color: var(--app-text-muted);
  font-size: 12px;
  text-align: center;
  line-height: 44px;
}

/* ---- 登录按钮 ---- */
:deep(.el-button--primary) {
  background: var(--app-accent);
  border: none;
  border-radius: var(--radius);
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  transition: all var(--transition-fast);
}

:deep(.el-button--primary:hover) {
  background: var(--app-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 89, 152, 0.25);
}

:deep(.el-button--primary:active) {
  transform: translateY(0);
}

/* ---- 版权 ---- */
.copyright {
  margin-top: 20px;
  color: var(--app-text-muted);
  font-size: 12px;
}

/* ========================= 响应式 ========================= */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-brand {
    flex: 0 0 auto;
    padding: 48px 20px 36px;
  }

  .login-brand::after {
    display: none;
  }

  .brand-logo {
    width: 44px;
    height: 44px;
    margin-bottom: 18px;
  }

  .brand-name {
    font-size: 32px;
    letter-spacing: 4px;
  }

  .brand-subtitle {
    font-size: 14px;
  }

  .brand-tagline {
    margin-top: 16px;
  }

  .brand-accent {
    margin-top: 20px;
  }

  .login-main {
    padding: 24px 16px 40px;
  }

  .login-box {
    width: 100%;
    max-width: 400px;
    padding: 32px 24px 24px;
  }
}

@media (max-width: 480px) {
  .captcha-img {
    width: 100px;
    min-width: 100px;
  }
}
</style>
